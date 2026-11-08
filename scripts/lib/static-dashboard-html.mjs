// Presentation fixtures render a dashboard page without its production
// bootstrap. The first-paint loaders (#manager-loading, #host-loading) and
// their non-blocking stylesheet links belong to that bootstrap: without the
// loader script the shell would stay hidden and unstyled. This returns the
// same page with every script removed, the loader surfaces deleted and each
// stylesheet applied at once, exactly as the loader leaves it when ready.
export function staticDashboardHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<html([^>]*?)\s+data-(?:manager|host)-loading(?:="")?/, "<html$1")
    .replace(/<section id="(?:manager|host)-loading"[\s\S]*?<\/section>/g, "")
    .replace(/<noscript>[\s\S]*?<\/noscript>/g, "")
    .replace(/ media="print" data-(?:manager|host)-style/g, "")
    .replace(/(<(?:main|div) class="platform-shell[^"]*")\s+inert\s+aria-busy="true"/, "$1");
}
