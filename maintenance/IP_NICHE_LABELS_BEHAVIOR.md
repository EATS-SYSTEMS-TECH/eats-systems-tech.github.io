# Use-case page label contract

This W3 subpackage starts at `6df2c2468a85901dbcef7e0915cf266bcb87598e`.
`scripts/niche-content.mjs` exports one ordinary mutable object named
`NICHE_CHROME`. Its 39 locale keys and their insertion order must remain
identical. Each record has exactly four keys, in this order: `eyebrow`,
`benefitsTitle`, `homeLabel`, `faqTitle`. Every string, including Unicode,
punctuation and spacing, stays exactly the same. No translation changes or
locale fallback are introduced. There are no side effects, I/O or imports.

Freeze a hash of the complete actually imported object before removal.
After a separate removal commit, create a compact table of the frozen label
facts and independently assemble ordinary records from their ordered columns.
Explain both the table and assembly blocks in comments. Keep all four labels
available to the existing localized page builder without changing its API.
The contract executes the actual complete module and compares its entire
serialized object hash, locale order, field order and string completeness.

This preserves the existing short UI wording as declared compatibility data;
it does not assert newly created translations or clear trademark/legal rights.
The old object-literal serialization is removed. The remaining W3 template,
styles, builder and final generated-page acceptance stay separate and open.
