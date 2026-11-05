import { hostText } from "./host-locale.js";
import { node } from "./host-ui.js";

export function reservationExample(
  systemId = "YOUR_SYSTEM_ID",
  now = Date.now(),
) {
  const start = new Date(now + 86400000);
  start.setUTCHours(12, 0, 0, 0);
  return {
    systemId,
    source: "hotel-pms",
    externalReference: "booking-1042",
    guest: { name: "Alex Guest", phone: "+15550001234" },
    access: {
      startsAt: start.toISOString(),
      endsAt: new Date(start.getTime() + 2 * 86400000).toISOString(),
    },
    accessNote: {
      note: "Reception is open until 22:00",
      residentName: "Hotel reception",
      floor: "1",
      apartment: "101",
      parking: "P12",
      address: "12 Example Street",
      latitude: 0,
      longitude: 0,
    },
    delivery: { channel: "none" },
  };
}

export function reservationCode(language, body) {
  const json = JSON.stringify(body, null, 2);
  const endpoint = "https://YOUR_API_HOST/v1/reservations";
  const headers = JSON.stringify(
    {
      Authorization: "Bearer YOUR_HOST_API_KEY",
      "Content-Type": "application/json",
      "Idempotency-Key": "hotel-pms-booking-1042-v1",
    },
    null,
    2,
  );
  const js = `const url = ${JSON.stringify(endpoint)};\nconst headers = ${headers};\nconst booking = ${json};\n`;
  switch (language) {
    case "node-fetch":
      return (
        js +
        `\nconst response = await fetch(url, { method: "POST", headers, body: JSON.stringify(booking) });\nconst result = await response.json();\nif (!response.ok) throw new Error(result.error?.code ?? "REQUEST_FAILED");\nconsole.log(result);\n// GET result.statusUrl with the same Authorization header until guestAccess.status is issued.\n// Keep the same Idempotency-Key when retrying this exact request.`
      );
    case "node-axios":
      return (
        `import axios from "axios";\n\n` +
        js +
        `\nconst { data } = await axios.post(url, booking, { headers, timeout: 15000 });\nconsole.log(data);\n// Fetch data.statusUrl for the current guestAccess status.`
      );
    case "python-requests":
    case "python-httpx": {
      const library = language === "python-requests" ? "requests" : "httpx";
      return `import json\nimport ${library}\n\nurl = ${JSON.stringify(endpoint)}\nheaders = ${headers}\nbooking = json.loads(r'''${json}''')\n\nresponse = ${library}.post(url, headers=headers, json=booking, timeout=15)\nresponse.raise_for_status()\nresult = response.json()\nprint(result)\n# GET result["statusUrl"] for the current guestAccess status.`;
    }
    case "php-curl":
      return `<?php\n$url = '${endpoint}';\n$body = <<<'JSON'\n${json}\nJSON;\n$curl = curl_init($url);\ncurl_setopt_array($curl, [\n    CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15,\n    CURLOPT_HTTPHEADER => [\n        'Authorization: Bearer YOUR_HOST_API_KEY',\n        'Content-Type: application/json',\n        'Idempotency-Key: hotel-pms-booking-1042-v1'\n    ],\n    CURLOPT_POSTFIELDS => $body\n]);\n$result = curl_exec($curl);\nif ($result === false) throw new RuntimeException(curl_error($curl));\n$status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);\ncurl_close($curl);\nif ($status >= 400) throw new RuntimeException($result);\necho $result;`;
    case "php-guzzle":
      return `<?php\nrequire 'vendor/autoload.php';\n$client = new GuzzleHttp\\Client(['timeout' => 15]);\n$body = <<<'JSON'\n${json}\nJSON;\n$response = $client->post('${endpoint}', [\n    'headers' => [\n        'Authorization' => 'Bearer YOUR_HOST_API_KEY',\n        'Content-Type' => 'application/json',\n        'Idempotency-Key' => 'hotel-pms-booking-1042-v1'\n    ],\n    'body' => $body\n]);\necho $response->getBody();`;
    case "csharp":
      return `using System.Net.Http;\nusing System.Text;\n\nusing var client = new HttpClient();\nusing var request = new HttpRequestMessage(HttpMethod.Post, "${endpoint}");\nrequest.Headers.Add("Authorization", "Bearer YOUR_HOST_API_KEY");\nrequest.Headers.Add("Idempotency-Key", "hotel-pms-booking-1042-v1");\nvar json = """\n${json}\n""";\nrequest.Content = new StringContent(json, Encoding.UTF8, "application/json");\nusing var response = await client.SendAsync(request);\nvar result = await response.Content.ReadAsStringAsync();\nresponse.EnsureSuccessStatusCode();\nConsole.WriteLine(result);`;
    default:
      return `curl --request POST '${endpoint}' \\\n  --header 'Authorization: Bearer YOUR_HOST_API_KEY' \\\n  --header 'Content-Type: application/json' \\\n  --header 'Idempotency-Key: hotel-pms-booking-1042-v1' \\\n  --data '${json}'`;
  }
}

export function renderApiExamples(container, systems = []) {
  const details = node("details", undefined, { class: "host-api-examples" });
  details.append(node("summary", hostText("Integration examples")));
  const controls = node("div", undefined, {
    class: "host-api-example-controls",
  });
  const selector = (title, options) => {
    const label = node("label", hostText(title));
    const select = node("select", undefined, { "aria-label": title });
    for (const [value, text] of options)
      select.append(node("option", text, { value }));
    label.append(select);
    controls.append(label);
    return select;
  };
  const language = selector("Programming language", [
    ["curl", "cURL"],
    ["node-fetch", "Node.js · fetch"],
    ["node-axios", "Node.js · Axios"],
    ["python-requests", "Python · requests"],
    ["python-httpx", "Python · httpx"],
    ["php-curl", "PHP · cURL"],
    ["php-guzzle", "PHP · Guzzle"],
    ["csharp", "C# · HttpClient"],
  ]);
  const category = selector("System type", [
    ["gate", hostText("Gate")],
    ["dual-control", hostText("Dual Control")],
    ["ROLLER_SHUTTER", hostText("Roller Shutter")],
    ["group", hostText("Group")],
  ]);
  const system = selector("Organization system", []);
  const id = node("code", "YOUR_SYSTEM_ID", { dir: "ltr" });
  const copyId = node("button", hostText("Copy systemId"), {
    type: "button",
    class: "button-secondary",
  });
  const pre = node("pre", undefined, {
    dir: "ltr",
    tabindex: "0",
    "aria-label": "Request example",
  });
  const code = node("code");
  pre.append(code);
  const copy = node("button", hostText("Copy example"), {
    type: "button",
    class: "button-secondary",
  });
  const status = node("p", "", { role: "status" });
  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = hostText("Copied");
    } catch {
      status.textContent = hostText(
        "Copy unavailable. Select the text and copy it.",
      );
    }
  };
  copy.addEventListener("click", () => void copyText(code.textContent));
  copyId.addEventListener("click", () => void copyText(id.textContent));
  function renderCode() {
    id.textContent = system.value || "YOUR_SYSTEM_ID";
    code.textContent = reservationCode(
      language.value,
      reservationExample(id.textContent),
    );
  }
  function chooseSystems() {
    system.replaceChildren(
      node("option", hostText("Example system"), { value: "YOUR_SYSTEM_ID" }),
    );
    for (const row of systems.filter(
      (row) =>
        row.status === "active" &&
        (row.category === "ROLLER_SHUTTER" ? "ROLLER_SHUTTER" : row.type) ===
          category.value,
    )) {
      system.append(node("option", row.name ?? row.id, { value: row.id }));
    }
    renderCode();
  }
  language.addEventListener("change", renderCode);
  system.addEventListener("change", renderCode);
  category.addEventListener("change", chooseSystems);
  const identity = node("div", undefined, { class: "host-api-system-id" });
  identity.append(id, copyId);
  const response = node(
    "pre",
    JSON.stringify(
      {
        reservation: { id: "RESERVATION_ID", version: 1, status: "confirmed" },
        guestAccess: {
          status: "pending",
          delivery: { channel: "none", status: "not_requested" },
        },
        statusUrl: "/v1/reservations/RESERVATION_ID",
        offlineRevocation: "expires_at_effective_end",
      },
      null,
      2,
    ),
    { dir: "ltr", tabindex: "0" },
  );
  const guide = node("div", undefined, { class: "host-api-example-guide" });
  guide.append(
    node("h3", hostText("After creating a reservation")),
    node(
      "p",
      hostText(
        "The reservation appears in the calendar immediately. Fetch statusUrl until guestAccess.status is issued and inviteUrl is available. Your software sends that link to the guest.",
      ),
    ),
    node("code", "GET /v1/reservations/{id}", { dir: "ltr" }),
    node(
      "p",
      hostText(
        "To change a booking, send the booking fields and its current version. To cancel, send its current version. Use a new idempotency key for each change; keep the same key when retrying it.",
      ),
    ),
    node("code", "PUT /v1/reservations/{id}", { dir: "ltr" }),
    node("code", 'POST /v1/reservations/{id}/cancel  { "version": 1 }', {
      dir: "ltr",
    }),
    node(
      "p",
      hostText(
        "Access notes override only the fields supplied for this invitation. A Roller Shutter uses the stored Dual Control key and its ROLLER_SHUTTER category.",
      ),
    ),
    node(
      "p",
      hostText(
        "Cancellation stops new access. A pass already imported into a guest's app remains valid until its effective end.",
      ),
    ),
  );
  details.append(
    node(
      "p",
      hostText(
        "Replace the API host and API key placeholders on your server. Examples never include a private key. Enable reservation read/write and guest invitation permissions.",
      ),
    ),
    controls,
    identity,
    pre,
    copy,
    status,
    node("h3", hostText("Creation response · 201")),
    response,
    guide,
  );
  container.append(details);
  chooseSystems();
}
