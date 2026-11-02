// A legacy alias is a minimal HTML5 document (optional head, body and end tags
// omitted) whose canonical link, refresh, script and fallback link all name the
// same destination. Values are written as supplied so query strings and
// fragments reach the destination unchanged.
export function buildRedirectPage(targetPath, canonicalUrl) {
  const lines = [
    "<!doctype html>",
    '<html lang="en" dir="ltr">',
    '<meta charset="utf-8">',
    "<title>Page moved | WIFIGATE</title>",
    `<link rel="canonical" href="${canonicalUrl}">`,
    `<meta http-equiv="refresh" content="0; url=${targetPath}">`,
    `<script>window.location.replace(${JSON.stringify(targetPath)})</script>`,
    `<p>This page has moved to <a href="${targetPath}">${targetPath}</a>.</p>`,
  ];
  return `${lines.join("\n")}\n`;
}
