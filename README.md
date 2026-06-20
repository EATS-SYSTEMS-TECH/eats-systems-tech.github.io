# eats-systems-tech.github.io

Static multilingual site structure:

- Source templates live under `templates/`.
- Published localized pages are generated into `/`, `/he/`, `/es/`, `/fr/`, and the other language-code folders.
- Use language codes for URLs, not country codes. Example: `/he/`, not `/il/`.
- Rebuild all localized pages with `npm run build:locales`.