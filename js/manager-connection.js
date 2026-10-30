import {
  managerKey,
  randomHex,
  bytesHex,
  managerHandshake,
  completeManagerHandshake,
  encryptManagerCommand,
  decryptManagerResponse,
  eraseManagerSession,
  managerBulkFrame,
  decryptManagerBulk,
  sha,
} from "./manager-crypto.js";
import { managerDemandTiming } from "./manager-connection-timing.js";

const sleep = (ms, signal) =>
  new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error("CANCELLED"));
      return;
    }
    const aborted = () => {
      clearTimeout(timer);
      reject(new Error("CANCELLED"));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", aborted);
      resolve();
    }, ms);
    signal.addEventListener("abort", aborted, { once: true });
  });
export class ManagerConnection {
  constructor({ api, user, onState = () => {}, onTiming = () => {}, timingVersion = 1, WebSocketImpl = WebSocket }) {
    this.api = api;
    this.user = user;
    this.onState = onState;
    this.onTiming = onTiming;
    this.timingVersion = timingVersion === 2 ? 2 : 1;
    this.WebSocketImpl = WebSocketImpl;
    this.waiters = [];
    this.abort = new AbortController();
    this.closed = false;
    this.busy = false;
  }
  async open(systemId) {
    if (this.closed || this.opening || this.session) throw new Error("BUSY");
    this.opening = true;
    try {
      return await this.openSession(systemId);
    } catch (error) {
      this.close();
      throw this.failure || error;
    } finally {
      this.opening = false;
    }
  }
  requireOpen() {
    if (!this.closed) return;
    eraseManagerSession(this.session);
    this.session = null;
    this.key = null;
    throw this.failure || new Error("CANCELLED");
  }
  async openSession(systemId) {
    this.onState("waiting");
    this.key = await managerKey(this.user.uid);
    this.requireOpen();
    this.sessionId = randomHex(8);
    this.identity = await this.api(
      `/gates/${encodeURIComponent(systemId)}/identity`,
    );
    this.requireOpen();
    const clientPublicKey = bytesHex(
      await crypto.subtle.exportKey("raw", this.key.publicKey),
    );
    this.requireOpen();
    const requestedAt = Date.now();
    this.creation = this.api("/connection-requests", "POST", {
      systemId,
      clientPublicKey,
      sessionId: this.sessionId,
      ...(this.timingVersion === 2 ? { timingVersion: 2 } : {}),
    });
    const request = await this.creation;
    this.requestId = request.requestId;
    if (this.closed) {
      await this.cancelDemand();
      this.requireOpen();
    }
    this.demandTiming = managerDemandTiming(request, this.timingVersion, requestedAt);
    this.onTiming(this.demandTiming);
    const shortenDeadline = (expiresAt) => {
      clearTimeout(this.initialDeadline);
      this.initialDeadline = setTimeout(() => this.fail(new Error("NO_COMMUNICATION")), Math.max(0, expiresAt - Date.now()));
    };
    let end = this.demandTiming.expiresAt;
    shortenDeadline(end);
    let state;
    while (!this.closed && Date.now() < end) {
      state = await this.api(`/connection-requests/${this.requestId}`);
      this.requireOpen();
      if (state.timingVersion !== undefined || state.expiresAt !== undefined) {
        const actual = managerDemandTiming(state, this.timingVersion, requestedAt);
        if (actual.timingVersion !== this.demandTiming.timingVersion) throw new Error("INVALID_CONNECTION_TIMING");
        if (actual.expiresAt < end) { end = actual.expiresAt; shortenDeadline(end); }
      }
      if (Date.now() >= end) throw new Error("NO_COMMUNICATION");
      if (state.state === "ready" && state.nonce && state.clientTicket) break;
      await sleep(Math.min(1500, Math.max(0, end - Date.now())), this.abort.signal);
    }
    if (this.closed || state?.state !== "ready")
      throw new Error("NO_COMMUNICATION");
    const url = new URL(state.relayUrl);
    url.pathname = "/v1/manager/client";
    if (
      url.protocol !== "wss:" &&
      !(
        url.protocol === "ws:" &&
        ["localhost", "127.0.0.1"].includes(url.hostname)
      )
    )
      throw new Error("INVALID_RELAY");
    this.onState("connecting");
    this.socket = new this.WebSocketImpl(url.href);
    this.socket.binaryType = "arraybuffer";
    const ready = this.next((v) => v.type === "relay_ready");
    // A socket failure may happen before the open promise settles.
    // Observe rejection immediately; awaiting `ready` below still propagates it.
    void ready.catch(() => {});
    this.socket.onmessage = (event) => {
      if (typeof event.data !== "string") {
        this.onBulk?.(new Uint8Array(event.data));
        return;
      }
      let value;
      try {
        value = JSON.parse(event.data);
      } catch {
        this.fail(new Error("INVALID_FRAME"));
        return;
      }
      if (value.type === "manager_challenge") {
        void this.renew(value.nonce).catch((error) => this.fail(error));
        return;
      }
      const index = this.waiters.findIndex((v) => v.match(value));
      if (index >= 0) {
        const [waiter] = this.waiters.splice(index, 1);
        clearTimeout(waiter.timer);
        waiter.resolve(value);
      }
    };
    this.socket.onclose = () => this.fail(new Error("DISCONNECTED"));
    this.socket.onerror = () => this.fail(new Error("CONNECTION_FAILED"));
    await new Promise((resolve, reject) => {
      const finish = (error) => {
        clearTimeout(timer);
        this.abort.signal.removeEventListener("abort", aborted);
        error ? reject(error) : resolve();
      };
      const aborted = () => finish(this.failure || new Error("CANCELLED"));
      const timer = setTimeout(() => finish(new Error("CONNECTION_TIMEOUT")), 10000);
      this.abort.signal.addEventListener("abort", aborted, { once: true });
      this.socket.onopen = () => finish();
      this.socket.addEventListener(
        "error",
        () => {
          finish(new Error("CONNECTION_FAILED"));
        },
        { once: true },
      );
    });
    this.requireOpen();
    this.socket.send(
      JSON.stringify({
        type: "client_auth",
        requestId: this.requestId,
        ticket: state.clientTicket,
      }),
    );
    await ready;
    this.requireOpen();
    const grant = await this.authorize(state.nonce);
    const handshake = await managerHandshake({
      identity: this.identity,
      keyPair: this.key,
      sessionId: this.sessionId,
      grant,
    });
    this.requireOpen();
    const response = this.next((v) =>
      ["device_hello", "hello_error", "server_busy"].includes(v.type),
    );
    this.socket.send(JSON.stringify(handshake.hello));
    this.session = await completeManagerHandshake(
      handshake.state,
      await response,
    );
    this.requireOpen();
    clearTimeout(this.initialDeadline);
    this.onState("active");
    this.capabilities = await this.command("ADMIN_GET_CAPABILITIES", {
      clientAdminVersions: [1],
      clientBulkVersions: [1],
    });
    this.requireOpen();
    this.heartbeat = setInterval(() => {
      if (!this.busy && !this.transfer)
        void this.command("ADMIN_PING", {}).catch((error) => this.fail(error));
    }, 10000);
    this.maximum = setTimeout(
      () => this.fail(new Error("SECURE_SESSION_EXPIRED")),
      280000,
    );
    return this.capabilities;
  }
  next(match, timeout = 15000) {
    if (this.closed) return Promise.reject(new Error("CANCELLED"));
    return new Promise((resolve, reject) => {
      const waiter = {
        match,
        resolve,
        reject,
        timer: setTimeout(() => {
          this.waiters = this.waiters.filter((v) => v !== waiter);
          reject(new Error("RESPONSE_TIMEOUT"));
        }, timeout),
      };
      this.waiters.push(waiter);
    });
  }
  async authorize(nonce) {
    if (!/^[a-f0-9]{64}$/.test(nonce)) throw new Error("INVALID_NONCE");
    const grant = await this.api(
      `/connection-requests/${this.requestId}/grants`,
      "POST",
      { nonce },
    );
    this.requireOpen();
    const response = this.next((v) => v.type === "manager_authorized");
    this.socket.send(JSON.stringify({ type: "manager_authorize", ...grant }));
    await response;
    return grant;
  }
  async renew(nonce) {
    if (this.renewing || this.closed) return;
    this.renewing = true;
    try {
      await this.authorize(nonce);
    } finally {
      this.renewing = false;
    }
  }
  async command(cmd, payload = {}, timeout = cmd === "ADMIN_LIST_HISTORY" ? 35000 : 15000) {
    if (this.closed || !this.session) throw new Error("DISCONNECTED");
    if (this.busy) throw new Error("BUSY");
    this.busy = true;
    if (this.transfer && !/^ADMIN_(IMPORT|EXPORT)_/.test(cmd)) {
      this.busy = false;
      throw new Error("BUSY");
    }
    this.pendingCommand = cmd;
    try {
      const command = {
        cmd,
        freshnessMs: 15000,
        utc: Math.floor(Date.now() / 1000),
        ...(this.timeZoneOffset === undefined
          ? {}
          : { tz: String(this.timeZoneOffset) }),
        admin: { version: 1, requestId: crypto.randomUUID(), payload },
      };
      const text = await encryptManagerCommand(this.session, command);
      const response = this.next(
        (v) => v.type === "frame" && v.seq === this.session.seq,
        timeout,
      );
      this.socket.send(text);
      const data = await decryptManagerResponse(this.session, await response);
      if (Number.isInteger(data.clock?.tz)) this.timeZoneOffset = data.clock.tz;
      if (data.cmd !== cmd) throw new Error("RESPONSE_MISMATCH");
      if (data.status !== "OK")
        throw Object.assign(
          new Error(data.admin?.error?.code ?? data.status ?? "COMMAND_FAILED"),
          { code: data.admin?.error?.code, reason: data.admin?.error?.message },
        );
      return data.admin;
    } catch (error) {
      if (["RESPONSE_TIMEOUT", "DISCONNECTED"].includes(error.message))
        this.fail(error);
      throw error;
    } finally {
      this.busy = false;
      this.pendingCommand = null;
    }
  }
  fail(error) {
    if (this.closed) return this.closing;
    this.failure = error;
    this.onState(error.message);
    this.close();
  }
  bulkReceiver() {
    const frames = [];
    let waiting, terminal;
    this.onBulk = (data) => {
      if (waiting) {
        const r = waiting;
        waiting = null;
        r.resolve(data);
      } else if (frames.length < 32) frames.push(data);
      else {
        terminal = new Error("BULK_OVERFLOW");
        this.fail(terminal);
      }
    };
    return {
      next: () => {
        if (terminal) return Promise.reject(terminal);
        if (frames.length) return Promise.resolve(frames.shift());
        if (this.closed) return Promise.reject(new Error("DISCONNECTED"));
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            waiting = null;
            reject(new Error("BULK_TIMEOUT"));
          }, 15000);
          waiting = {
            resolve: (data) => {
              clearTimeout(timer);
              resolve(data);
            },
            reject: (error) => {
              clearTimeout(timer);
              reject(error);
            },
          };
        });
      },
      close: () => {
        this.onBulk = null;
        terminal = new Error("CANCELLED");
        waiting?.reject(terminal);
        waiting = null;
        frames.length = 0;
      },
    };
  }
  collectionCapacity(collection) {
    if (!["USERS", "ADMINS"].includes(collection))
      throw new Error("INVALID_COLLECTION");
    const value =
      this.capabilities?.data?.limits?.[
        collection === "USERS" ? "maxUsers" : "maxAdmins"
      ];
    if (
      !Number.isInteger(value) ||
      value < 1 ||
      value > (collection === "USERS" ? 5000 : 20)
    )
      throw new Error("INVALID_CAPABILITIES");
    return value;
  }
  async exportCollection(collection, onProgress = () => {}) {
    if (this.transfer) throw new Error("BUSY");
    const capacity = this.collectionCapacity(collection);
    this.transfer = true;
    const receiver = this.bulkReceiver();
    let id;
    try {
      const begin = (
        await this.command("ADMIN_EXPORT_BEGIN", { collection }, 60000)
      ).data;
      id = begin.transferId;
      if (
        !Number.isInteger(id) ||
        id < 1 ||
        !Number.isInteger(begin.recordCount) ||
        begin.recordCount < 0 ||
        begin.recordCount > capacity
      )
        throw new Error("INVALID_EXPORT");
      const parts = [];
      let received = 0,
        lastSeq = 0,
        sendSeq = 1;
      const ack = async () =>
        this.socket.send(
          await managerBulkFrame(this.session, "c2d", {
            type: 2,
            transferId: id,
            packetSeq: sendSeq++,
            byteOffset: received,
            flagsOrValue: 1,
          }),
        );
      if (begin.recordCount) {
        await ack();
        for (;;) {
          const f = await decryptManagerBulk(
            this.session,
            await receiver.next(),
          );
          if (
            f.type !== 1 ||
            f.transferId !== id ||
            f.packetSeq <= lastSeq ||
            f.byteOffset !== received ||
            received + f.plaintext.length > begin.recordCount * 1024
          )
            throw new Error("INVALID_EXPORT");
          lastSeq = f.packetSeq;
          parts.push(f.plaintext);
          received += f.plaintext.length;
          onProgress(received);
          await ack();
          if (f.flagsOrValue & 1) break;
        }
      }
      const result = (
        await this.command("ADMIN_EXPORT_FINISH", { transferId: id }, 60000)
      ).data;
      id = null;
      const bytes = new Uint8Array(received);
      let at = 0;
      for (const part of parts) {
        bytes.set(part, at);
        at += part.length;
      }
      if (
        result.byteCount !== bytes.length ||
        result.recordCount !== begin.recordCount ||
        result.sha256 !== bytesHex(await sha(bytes))
      )
        throw new Error("EXPORT_DIGEST_MISMATCH");
      return new TextDecoder("utf-8", { fatal: true })
        .decode(bytes)
        .split("\n")
        .filter(Boolean)
        .map((row) => JSON.parse(row));
    } finally {
      if (id && !this.closed)
        await this.command("ADMIN_EXPORT_ABORT", { transferId: id }).catch(
          () => {},
        );
      receiver.close();
      this.transfer = false;
    }
  }
  async importCollection(
    collection,
    mode,
    rows,
    expectedRevision,
    confirmCommit,
    onProgress = () => {},
  ) {
    if (this.transfer) throw new Error("BUSY");
    const capacity = this.collectionCapacity(collection);
    if (!rows.length || rows.length > capacity)
      throw new Error("INVALID_IMPORT");
    this.transfer = true;
    const data = new TextEncoder().encode(
      rows.map((r) => JSON.stringify(r) + "\n").join(""),
    );
    if (data.length > capacity * 1024) {
      this.transfer = false;
      throw new Error("IMPORT_TOO_LARGE");
    }
    const receiver = this.bulkReceiver();
    let id;
    try {
      const begin = (
        await this.command(
          "ADMIN_IMPORT_BEGIN",
          {
            collection,
            mode,
            schemaVersion: 2,
            recordCount: rows.length,
            byteCount: data.length,
            sha256: bytesHex(await sha(data)),
            expectedRevision,
          },
          120000,
        )
      ).data;
      id = begin.transferId;
      let offset = begin.acceptedOffset,
        seq = 1,
        receiveSeq = 0,
        credits = begin.credits;
      const size = Math.min(476, begin.maxPacketBytes);
      if (
        !Number.isInteger(id) ||
        id < 1 ||
        !Number.isInteger(offset) ||
        offset !== 0 ||
        !Number.isInteger(size) ||
        size < 1 ||
        !Number.isInteger(credits) ||
        credits < 1 ||
        credits > 8
      )
        throw new Error("INVALID_IMPORT");
      let sent = offset,
        inFlight = [];
      while (offset < data.length) {
        while (inFlight.length < credits && sent < data.length) {
          const end = Math.min(data.length, sent + size);
          this.socket.send(
            await managerBulkFrame(this.session, "c2d", {
              type: 1,
              transferId: id,
              packetSeq: seq++,
              byteOffset: sent,
              flagsOrValue: end === data.length ? 1 : 0,
              plaintext: data.slice(sent, end),
            }),
          );
          sent = end;
          inFlight.push(end);
        }
        const f = await decryptManagerBulk(this.session, await receiver.next());
        if (
          f.transferId !== id ||
          f.packetSeq <= receiveSeq ||
          ![2, 3].includes(f.type) ||
          f.byteOffset < 0 ||
          f.byteOffset > sent ||
          f.flagsOrValue < 1 ||
          f.flagsOrValue > 8
        )
          throw new Error("INVALID_IMPORT_ACK");
        receiveSeq = f.packetSeq;
        if (f.type === 3) {
          if (f.flagsOrValue !== 1) throw new Error("IMPORT_REJECTED");
          offset = f.byteOffset;
          sent = offset;
          inFlight = [];
          credits = 1;
          continue;
        }
        if (f.byteOffset < offset) throw new Error("INVALID_IMPORT_ACK");
        offset = f.byteOffset;
        inFlight = inFlight.filter((end) => end > offset);
        credits = f.flagsOrValue;
        onProgress(offset, data.length);
      }
      const digest = bytesHex(await sha(data));
      let validation;
      do {
        validation = (
          await this.command(
            "ADMIN_IMPORT_VALIDATE",
            { transferId: id, sha256: digest },
            120000,
          )
        ).data;
        if (validation.pending) await sleep(100, this.abort.signal);
      } while (validation.pending);
      if (!validation.valid || validation.rejected)
        throw new Error("IMPORT_REJECTED");
      if (!(await confirmCommit(validation))) return { cancelled: true };
      const result = (
        await this.command(
          "ADMIN_IMPORT_COMMIT",
          { transferId: id, sha256: digest, expectedRevision },
          120000,
        )
      ).data;
      id = null;
      return result;
    } finally {
      if (id && !this.closed)
        await this.command(
          "ADMIN_IMPORT_ABORT",
          { transferId: id },
          60000,
        ).catch(() => {});
      receiver.close();
      this.transfer = false;
      data.fill(0);
    }
  }
  close() {
    if (this.closed) return this.closing;
    this.closed = true;
    this.abort.abort();
    clearInterval(this.heartbeat);
    clearTimeout(this.maximum);
    clearTimeout(this.initialDeadline);
    for (const w of this.waiters) {
      clearTimeout(w.timer);
      w.reject(new Error("CANCELLED"));
    }
    this.waiters = [];
    this.socket?.close();
    eraseManagerSession(this.session);
    this.session = null;
    this.key = null;
    if (this.requestId) this.closing = this.cancelDemand();
    else if (this.creation) this.closing = this.creation.then(request => {
      this.requestId = request.requestId;
      return this.cancelDemand();
    }).catch(() => {});
    return this.closing;
  }
  cancelDemand() {
    if (this.requestId && !this.cancellingDemand) this.cancellingDemand = this.api(
      `/connection-requests/${this.requestId}/cancel`, "POST", {},
    ).catch(() => {});
    return this.cancellingDemand;
  }
}
