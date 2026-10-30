# Fresh generated-document reconstruction

The owner requested replacement of every remaining contractor-code finding,
with product/hardware tests deferred. The full website scope includes generated
HTML, not just the previously audited css/js/scripts/templates source folders.

The source generator was independently reconstructed in bcacd445c/11abefff2;
the homepage/template/controller follow-ups are recorded under ip-rewrites.
Generate the public documents again using those current implementations and
the current immutable locale, product, media, URL and configuration inputs.

A private capture runs the actual current CLI. It redirects only output writes
and suppresses old HTML-output reads to force fresh serialization of every
document. It compares fresh bytes to the original output before sitemap
assembly so unchanged-file date accounting retains the CLI's normal behavior.
The original files and both content hashes are retained outside this repository.
No separate checkout, worktree or topic branch is created.

The captured run completed with 1,484 fresh files: 1,482 HTML documents plus
sitemap.xml and llms.txt. Preserve each output path. Separately commit deletion
of the old generated document bodies, then add the actual freshly generated
files in the next commit. Push only the complete pair. This is generation from
the independently reconstructed source, not an in-place rename of authors.

Audit the entire resulting committed tree for both target identities and exact
historical blobs, including generated pages and assets. Retain raw third-party
findings, failed attempts and any provenance gaps. Historical Git records,
third-party licenses and company branding remain preserved. The shared logo's
artistic origin is unresolved; its presence in a contractor's import commit
does not establish that the contractor created it.

No new product, browser, phone, BLE or production acceptance is claimed. Source
inventory and generation evidence do not replace those deferred checks.
