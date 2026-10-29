// Localize only the legacy relative-home prefix, preserving its literal hash
// and original query-dropping behavior without normalizing unrelated URLs.
export function rewriteNicheHomeAnchors($, homePath) {
  $("a[href^='../index.html']").attr("href", (_index, original) => {
    const fragmentStart = original.indexOf("#");
    return fragmentStart < 0 ? homePath : homePath + original.slice(fragmentStart);
  });
}
