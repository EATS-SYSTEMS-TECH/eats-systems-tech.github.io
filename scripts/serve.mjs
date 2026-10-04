import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const port = Number.parseInt(process.env.PORT ?? "8000", 10);
const host = process.env.HOST ?? "127.0.0.1";

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

        response.writeHead(200, {
            "Cache-Control": "no-store",
            "Content-Length": fileStats.size,
            "Content-Type": contentTypes.get(path.extname(filePath).toLowerCase()) ?? "application/octet-stream",
        });

        if (request.method === "HEAD") {
            response.end();
            return;
        }

        createReadStream(filePath).pipe(response);
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
    console.log(`Local site: http://${host}:${port}`);
});