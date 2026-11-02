# Inline script data serialization repair

The current builder's inlineJson performs JSON.stringify followed by replacing
`<` with itself. insertPageDataScript interpolates JSON.stringify directly.
Consequently a literal `</script>` inside data terminates the HTML script
element, regardless of whether its type is application/json or JavaScript.
The controlled browser regression must demonstrate the old failure and retain
it. This does not establish exploitation in the published static copy.

Use one independently implemented serializer at both boundaries. Preserve JSON
semantics, property order, primitive/array/null values, Unicode, nested objects,
toJSON call count and existing unsupported-value failures. Escape every literal
less-than character to the six-character JSON escape \u003c before inserting
the serialized data into HTML. Parsing the resulting JSON or evaluating its
JavaScript assignment must recover the exact original data; an HTML-looking
string must not create a DOM node or execute another script.

Keep all existing caller IDs/anchors, mutation order, locale keys, page routes,
configuration and copy. No production publication. Record the localized builder
integration as a narrow bug fix, not an independent rewrite of the complete
builder: its remaining inherited lines stay open. Follow the requested separate
delete/add commits for that file, without treating those commits as ownership
proof. The final builder still requires a complete independent rewrite.

Verify real Chromium HTML parsing for JavaScript and application/json scripts,
full data round trips, ordinary byte compatibility and source wiring at both
actual builder boundaries. The next full CLI comparison must retain and explain
any changed serialized data; no blanket generated-output parity claim.
