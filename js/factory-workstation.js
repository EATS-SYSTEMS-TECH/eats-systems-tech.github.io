import { getFactoryWorkspace, getFactoryJobs, createFactoryJob, changeFactoryJob } from "../api/factory.js";
import { workstationCopy, workstationMarkup } from "./factory-workstation-view.js";

const niimbotService = "e7810a71-73ae-499d-8c15-faa9aef0c3f2";
const hardwareProfiles = new Map([["8.0", "8.0 / 8 MB"], ["16.0", "16.0 / 16 MB"], ["16.1", "16.1 / 16 MB"]]);
const jobStatuses = new Set(["PENDING_FIXTURE", "CANCELLED", "QUARANTINED"]);
const identifier = (value) => typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value);
const releaseIdentifier = (value) => typeof value === "string" && /^WGREL-[A-Za-z0-9._-]{1,112}$/.test(value);
const label = (value) => typeof value === "string" && value.length >= 1 && value.length <= 160;

function validWorkspace(workspace) {
  return workspace?.mode === "PROD" &&
    ["founder", "operator"].includes(workspace.role) &&
    typeof workspace.provisioning?.available === "boolean" &&
    Array.isArray(workspace.stations) &&
    workspace.stations.every((station) => identifier(station?.id) && label(station.label) &&
      typeof station.enabled === "boolean" && (station.activeJobId == null || identifier(station.activeJobId)) &&
      Array.isArray(station.batches) && station.batches.every((batch) => identifier(batch?.id) &&
        label(batch.label) && releaseIdentifier(batch.releaseId) && hardwareProfiles.has(batch.profile) &&
        typeof batch.enabled === "boolean" && Number.isSafeInteger(batch.remaining) && batch.remaining >= 0));
}

function validHistory(history, stationId) {
  return Array.isArray(history?.jobs) && history.jobs.every((job) => identifier(job?.id) &&
    job.stationId === stationId && identifier(job.batchId) && releaseIdentifier(job.releaseId) &&
    hardwareProfiles.has(job.profile) && jobStatuses.has(job.status) &&
    typeof job.createdAt === "string" && Number.isFinite(Date.parse(job.createdAt))) &&
    (history.nextCursor == null || (typeof history.nextCursor === "string" && history.nextCursor.length <= 1024));
}

export function mountFactoryWorkstation({ root, identity, user, language, signOut }) {
  const copy = workstationCopy(language);
  const host = document.createElement("div");
  const view = host.attachShadow({ mode: "open" });
  const style = document.getElementById("factory-workstation-style").cloneNode();
  style.removeAttribute("id");
  const template = document.createElement("template");
  template.innerHTML = workstationMarkup(copy, language);
  view.append(style, template.content);
  root.replaceChildren(host);
  const field = (name) => view.querySelector('[data-factory="' + name + '"]');
  const write = (name, content) => { field(name).textContent = content; };
  const textDate = new Intl.DateTimeFormat(language === "he" ? "he-IL" : "en", { dateStyle: "short", timeStyle: "short" });
  const lifetime = new AbortController();
  const signal = lifetime.signal;
  const stationSelect = field("station");
  const batchSelect = field("batch");
  const tabs = [...view.querySelectorAll("[data-view]")];
  const operator = identity.user.displayName || identity.user.email || copy.operator;
  view.querySelector("#factory-operator").textContent = operator;
  write("sidebar-operator", operator);

  let workspace = null;
  let jobs = [];
  let cursor = null;
  let reading = false;
  let saving = false;
  let historyGeneration = 0;
  let historyStation;
  let pendingRequest;
  let printer;
  let connectingPrinter = false;

  function showView(selectedView, focus) {
    for (const tab of tabs) {
      const active = tab.dataset.view === selectedView;
      tab.tabIndex = active ? 0 : -1;
      tab.setAttribute("aria-selected", String(active));
      view.querySelector("#" + tab.getAttribute("aria-controls")).hidden = !active;
      if (active && focus) tab.focus();
    }
  }

  for (const [index, tab] of tabs.entries()) {
    tab.addEventListener("click", () => showView(tab.dataset.view, false));
    tab.addEventListener("keydown", (event) => {
      const step = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: language === "he" ? 1 : -1, ArrowRight: language === "he" ? -1 : 1 }[event.key];
      const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 :
        step ? (index + step + tabs.length) % tabs.length : null;
      if (next === null) return;
      event.preventDefault();
      showView(tabs[next].dataset.view, true);
    });
  }

  function setOptions(select, items, first, selected) {
    select.replaceChildren(new Option(first, ""), ...items.map((item) => new Option(item.label, item.id)));
    if (items.some((item) => item.id === selected)) select.value = selected;
    select.disabled = items.length === 0 || saving;
  }

  const station = () => workspace?.stations.find((item) => item.id === stationSelect.value);
  const batch = () => station()?.batches.find((item) => item.id === batchSelect.value);
  const latestJob = () => jobs[0];
  const statusName = (state) => ({ PENDING_FIXTURE: copy.queued, CANCELLED: copy.cancelled, QUARANTINED: copy.quarantined })[state];
  const formatDate = (value) => textDate.format(new Date(value));

  function setError(message = "") {
    write("error", message);
    field("error").hidden = !message;
  }

  function actionError(error) {
    return error?.status === 403 ? copy.denied : error?.status === 409 ? copy.conflict : copy.transient;
  }

  function render() {
    const currentStation = station();
    const currentBatch = batch();
    const last = latestJob();
    const pending = jobs.some((job) => job.status === "PENDING_FIXTURE");
    const stage = saving ? copy.busy : !workspace ? (reading ? copy.checking : copy.unavailable) :
      last ? statusName(last.status) : copy.authorized;
    write("phase", stage);
    write("phase-code", last?.status ?? "");
    view.querySelector(".operation").dataset.state = !workspace && !reading ? "failed" : "";
    write("status", workspace?.provisioning.available === false ? copy.waiting : "");
    field("progress").value = 0;
    write("firmware", currentBatch?.releaseId ?? copy.noRelease);
    write("release-id", currentBatch?.releaseId ?? "—");
    field("profile").options[0].text = hardwareProfiles.get(currentBatch?.profile) ?? "—";
    const canQueue = Boolean(currentStation?.enabled && !currentStation.activeJobId &&
      currentBatch?.enabled && historyStation === stationSelect.value && currentBatch.remaining > 0 && !pending);
    field("submit").disabled = saving || reading || !canQueue;
    write("submit", canQueue && workspace?.provisioning.available === false ? copy.queue : copy.program);
    write("device", workspace && !workspace.stations.length ? copy.noStations : copy.waiting);
    field("latest").hidden = !last;
    write("latest-id", last?.id ?? "");
    write("latest-time", last ? formatDate(last.createdAt) : "");
    write("latest-state", last ? statusName(last.status) : "");
    field("cancel-job").hidden = last?.status !== "PENDING_FIXTURE" || last.canCancel !== true;
    field("quarantine-job").hidden = last?.status !== "PENDING_FIXTURE" || last.canQuarantine !== true || workspace?.role !== "founder";
    field("cancel-job").disabled = saving;
    field("quarantine-job").disabled = saving;
    field("refresh").disabled = reading || saving;
    stationSelect.disabled = saving || !workspace?.stations.length;
    batchSelect.disabled = saving || !station()?.batches.length;
    write("logger-status", !workspace ? stage : last ? statusName(last.status) : copy.noJobs);
    write("log", jobs.slice().reverse().map((job) =>
      [formatDate(job.createdAt), job.status, job.id, job.profile, job.releaseId].join("  ·  ")).join("\n"));
    field("copy-log").disabled = jobs.length === 0 || !navigator.clipboard;
    field("earlier-jobs").hidden = !cursor;
    if (field("follow-log").checked) field("log").scrollTop = field("log").scrollHeight;
  }

  async function fetchHistory(stationId, earlier = false) {
    if (!stationId) return;
    if (!earlier) historyStation = undefined;
    const generation = ++historyGeneration;
    try {
      const result = await getFactoryJobs(user, stationId, earlier ? cursor : null, signal);
      if (signal.aborted || generation !== historyGeneration) return;
      if (!validHistory(result, stationId)) throw new Error("factory-history-contract");
      const seen = new Set(jobs.map((job) => job.id));
      jobs = earlier ? [...jobs, ...result.jobs.filter((job) => !seen.has(job.id))] : result.jobs;
      cursor = result.nextCursor ?? null;
      historyStation = stationId;
    } catch (error) {
      if (!signal.aborted && generation === historyGeneration) {
        if (!earlier || error?.status === 403 || error?.status === 404) {
          jobs = [];
          cursor = null;
          historyStation = undefined;
        }
        setError(actionError(error));
      }
    } finally {
      if (!signal.aborted && generation === historyGeneration) render();
    }
  }

  async function refresh() {
    if (reading || saving || signal.aborted) return;
    reading = true;
    render();
    try {
      const reply = await getFactoryWorkspace(user, signal);
      if (signal.aborted) return;
      if (!validWorkspace(reply)) throw new Error("factory-workspace-contract");
      const previousStation = stationSelect.value;
      const previousBatch = batchSelect.value;
      workspace = reply;
      const chosen = workspace.stations.some((item) => item.id === previousStation) ? previousStation :
        workspace.stations.length === 1 ? workspace.stations[0].id : "";
      setOptions(stationSelect, workspace.stations, workspace.stations.length ? copy.selectStation : copy.noStations, chosen);
      const batches = station()?.batches ?? [];
      const chosenBatch = batches.some((item) => item.id === previousBatch) ? previousBatch :
        batches.length === 1 ? batches[0].id : "";
      setOptions(batchSelect, batches, copy.selectBatch, chosenBatch);
      if (previousStation !== stationSelect.value) {
        jobs = [];
        cursor = null;
        ++historyGeneration;
      }
      await fetchHistory(stationSelect.value);
    } catch {
      if (signal.aborted) return;
      workspace = null;
      jobs = [];
      cursor = null;
      ++historyGeneration;
      setOptions(stationSelect, [], copy.selectStation, "");
      setOptions(batchSelect, [], copy.selectBatch, "");
    } finally {
      reading = false;
      if (!signal.aborted) render();
    }
  }

  async function saveWork(request, confirmed) {
    if (saving || reading || !station()) return;
    saving = true;
    setError();
    render();
    try {
      await request();
      if (signal.aborted) return;
      confirmed?.();
      saving = false;
      await refresh();
    } catch (error) {
      if (!signal.aborted) setError(actionError(error));
    } finally {
      saving = false;
      if (!signal.aborted) render();
    }
  }

  function printerStatus(message) {
    write("printer-status", printer ? copy.connected : copy.printerShortcut);
    field("printer-dot").classList.toggle("connected", Boolean(printer));
    write("summary-printer", printer?.name || "NIIMBOT");
    write("summary-status", printer ? copy.connected : copy.choosePrinter);
    write("printer-detail", message);
    field("connect").disabled = connectingPrinter || Boolean(printer) || !navigator.bluetooth;
    field("disconnect").disabled = !printer;
  }

  function disconnectPrinter() {
    const device = printer;
    printer = undefined;
    device?.gatt?.disconnect();
    if (!signal.aborted) printerStatus(copy.choosePrinter);
  }

  field("connect").addEventListener("click", async () => {
    if (!navigator.bluetooth || printer || connectingPrinter) return;
    connectingPrinter = true;
    printerStatus(copy.connecting);
    let device;
    try {
      device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [niimbotService] }, { namePrefix: "B21" }, { namePrefix: "NIIMBOT" }],
        optionalServices: [niimbotService],
      });
      if (signal.aborted) return;
      const server = await device.gatt.connect();
      await server.getPrimaryService(niimbotService);
      if (signal.aborted) {
        device.gatt.disconnect();
        return;
      }
      device.addEventListener("gattserverdisconnected", () => {
        if (printer !== device) return;
        printer = undefined;
        printerStatus(copy.choosePrinter);
      }, { once: true, signal });
      printer = device;
      printerStatus(copy.connected);
    } catch {
      device?.gatt?.disconnect();
      if (!signal.aborted) printerStatus(copy.printerError);
    } finally {
      connectingPrinter = false;
      if (!signal.aborted) field("connect").disabled = Boolean(printer);
    }
  });
  field("disconnect").addEventListener("click", disconnectPrinter);
  field("printer-shortcut").addEventListener("click", () => showView("printer", true));
  field("printer-settings").addEventListener("click", () => showView("printer", true));
  field("sign-out").addEventListener("click", signOut);
  field("refresh").addEventListener("click", () => {
    setError();
    void refresh();
  });
  stationSelect.addEventListener("change", () => {
    setError();
    jobs = [];
    cursor = null;
    ++historyGeneration;
    const bins = station()?.batches ?? [];
    setOptions(batchSelect, bins, copy.selectBatch, bins.length === 1 ? bins[0].id : "");
    render();
    void fetchHistory(stationSelect.value);
  });
  batchSelect.addEventListener("change", render);
  field("earlier-jobs").addEventListener("click", () => void fetchHistory(stationSelect.value, true));
  field("follow-log").addEventListener("change", render);
  field("copy-log").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(field("log").textContent);
      if (!signal.aborted) write("copy-status", copy.copied);
    } catch {
      if (!signal.aborted) write("copy-status", copy.copyError);
    }
  });
  field("program-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const selectedStation = station();
    const selectedBatch = batch();
    if (field("submit").disabled || !selectedStation || !selectedBatch) return;
    if (pendingRequest?.stationId !== selectedStation.id || pendingRequest?.batchId !== selectedBatch.id) {
      pendingRequest = { stationId: selectedStation.id, batchId: selectedBatch.id, key: crypto.randomUUID() };
    }
    const { stationId, batchId, key } = pendingRequest;
    void saveWork(() => createFactoryJob(user, stationId, batchId, key, signal), () => { pendingRequest = undefined; });
  });
  field("cancel-job").addEventListener("click", () => {
    const job = latestJob();
    if (job?.status === "PENDING_FIXTURE" && job.canCancel === true)
      void saveWork(() => changeFactoryJob(user, job.id, null, signal));
  });
  field("quarantine-job").addEventListener("click", () => {
    const job = latestJob();
    if (workspace?.role === "founder" && job?.status === "PENDING_FIXTURE" && job.canQuarantine === true)
      void saveWork(() => changeFactoryJob(user, job.id, "OPERATOR_REVIEW", signal));
  });

  printerStatus(navigator.bluetooth ? copy.choosePrinter : copy.notSupported);
  void refresh();
  const updateTimer = setInterval(() => {
    if (workspace && !document.hidden) void refresh();
  }, 20000);
  return {
    close() {
      lifetime.abort();
      clearInterval(updateTimer);
      disconnectPrinter();
      root.replaceChildren();
    },
  };
}
