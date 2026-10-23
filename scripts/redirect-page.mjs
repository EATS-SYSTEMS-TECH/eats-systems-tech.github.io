// Render all legacy navigation channels from the same supplied target while
// keeping canonical metadata independent and the original document bytes.
export function buildRedirectPage(targetPath, canonicalUrl) {
  return [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="UTF-8" />',
    "  <title>Redirecting...</title>",
    `  <link rel="canonical" href="${canonicalUrl}" />`,
    `  <meta http-equiv="refresh" content="0; url=${targetPath}" />`,
    `  <script>window.location.replace(${JSON.stringify(targetPath)});</script>`,
    "</head>",
    "<body>",
    `  <p>Redirecting to <a href="${targetPath}">${targetPath}</a>...</p>`,
    "</body>",
    "</html>",
    // The empty final line preserves exactly one trailing newline.
    "",
  ].join("\n");
}
