// Publish one localized canonical before discovering its historical aliases.
// Deferred rendering preserves output-path validation before serialization;
// deferred alias discovery preserves the completed canonical-write boundary.
export async function publishNicheVariant(
  { locale, pageKey, render, legacyKeys },
  { buildOutputFilePath, writeOutputFile, buildPagePath, buildPageUrl, buildRedirectPage },
) {
  const canonicalFile = buildOutputFilePath(locale, pageKey);
  await writeOutputFile(canonicalFile, render());

  // Every alias goes directly to the same localized canonical. Await each
  // write in source order; failures propagate without rolling back prior files
  // or allowing the caller to publish a premature sitemap entry.
  for (const alias of legacyKeys()) {
    const aliasFile = buildOutputFilePath(locale, alias);
    const redirect = buildRedirectPage(buildPagePath(locale, pageKey), buildPageUrl(locale, pageKey));
    await writeOutputFile(aliasFile, redirect);
  }
}
