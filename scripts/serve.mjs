import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LOCAL_SITE_PORTS, withLocalSources } from "./lib/content-security-policy.mjs";

const root = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const port = Number.parseInt(process.env.PORT ?? "8000", 10);
const host = process.env.HOST ?? "127.0.0.1";
const appCheckDebug = process.env.WIFIGATE_APP_CHECK_DEBUG === "1";
// GitHub Pages answers "max-age=600"; set CACHE_CONTROL to test caching like production.
const cacheControl = process.env.CACHE_CONTROL ?? "no-store";
const loopbackHosts = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);
// js/host-api-config.js switches to the local APIs only on these ports.
const localApis = LOCAL_SITE_PORTS.includes(port);
const withLocalApis = (html) => localApis ? withLocalSources(html) : html;

if (appCheckDebug && !loopbackHosts.has(host)) {
    throw new Error("App Check debug mode requires a loopback HOST (127.0.0.1, localhost or ::1)");
}

function loopbackRequest(request) {
    if (!request.headers.host) return false;
    try {
        const url = new URL(`http://${request.headers.host}`);
        return loopbackHosts.has(url.hostname) && !url.username && !url.password
            && url.pathname === "/" && !url.search && !url.hash;
    } catch {
        return false;
    }
}

const contentTypes = new Map([
    [".avif", "image/avif"],
    [".css", "text/css; charset=utf-8"],
    [".gif", "image/gif"],
    [".html", "text/html; charset=utf-8"],
    [".ico", "image/x-icon"],
    [".jpeg", "image/jpeg"],
    [".jpg", "image/jpeg"],
    [".js", "text/javascript; charset=utf-8"],
    [".json", "application/json; charset=utf-8"],
    [".mjs", "text/javascript; charset=utf-8"],
    [".mp4", "video/mp4"],
    [".png", "image/png"],
    [".svg", "image/svg+xml"],
    [".txt", "text/plain; charset=utf-8"],
    [".webm", "video/webm"],
    [".webp", "image/webp"],
    [".woff", "font/woff"],
    [".woff2", "font/woff2"],
    [".xml", "application/xml; charset=utf-8"],
]);

function send(response, statusCode, message) {
    response.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(message);
}

const server = createServer(async (request, response) => {
    if (appCheckDebug && !loopbackRequest(request)) {
        send(response, 403, "App Check debug mode is available only on loopback hosts");
        return;
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
        response.setHeader("Allow", "GET, HEAD");
        send(response, 405, "Method Not Allowed");
        return;
    }

    try {
        const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
        const relativePath = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, "");
        let filePath = path.resolve(root, relativePath);

        if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) {
            send(response, 403, "Forbidden");
            return;
        }

        let fileStats = await stat(filePath);
        if (fileStats.isDirectory()) {
            filePath = path.join(filePath, "index.html");
            fileStats = await stat(filePath);
        }

        if (!fileStats.isFile()) {
            send(response, 404, "Not Found");
            return;
        }

        // Firebase generates and stores the debug token in this browser. Only
        // the explicit opt-in flag is injected, never a token or a saved file.
        // It precedes the page's Content-Security-Policy meta, which therefore
        // does not apply to it. On 8000/8100 the pages call the local APIs and
        // Auth Emulator, so their policy admits those loopback origins too.
        const isHtml = path.extname(filePath).toLowerCase() === ".html";
        const servedHtml = isHtml && (appCheckDebug || localApis)
            ? Buffer.from(withLocalApis((await readFile(filePath, "utf8")).replace(
                /<head\b[^>]*>/i,
                (head) => appCheckDebug ? `${head}\n<script>self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;</script>` : head,
            )))
            : null;

        response.writeHead(200, {
            "Cache-Control": cacheControl,
            "Content-Length": servedHtml?.length ?? fileStats.size,
            "Content-Type": contentTypes.get(path.extname(filePath).toLowerCase()) ?? "application/octet-stream",
        });

        if (request.method === "HEAD") {
            response.end();
            return;
        }

        if (servedHtml) response.end(servedHtml);
        else createReadStream(filePath).pipe(response);
    } catch (error) {
        if (error instanceof URIError) {
            send(response, 400, "Bad Request");
        } else if (error?.code === "ENOENT") {
            send(response, 404, "Not Found");
        } else {
            console.error(error);
            send(response, 500, "Internal Server Error");
        }
    }
});

server.on("error", (error) => {
    console.error(`Could not start the server: ${error.message}`);
    process.exitCode = 1;
});

server.listen(port, host, () => {
    const address = host.includes(":") ? `[${host}]` : host;
    console.log(`Local site: http://${address}:${server.address().port}`);
    if (appCheckDebug) console.log("App Check debug mode enabled for this local server. Register the browser's debug token in Firebase App Check.");
});
