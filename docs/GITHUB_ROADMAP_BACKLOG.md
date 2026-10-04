# GitHub roadmap issue inventory

This is the issue inventory prepared from the request and the mobile checkout on 2026-09-25. Before publishing, search the live repository for each title and update an existing issue when it covers the same work. GitHub state and other repositories could not be inspected without repository access. Every issue should carry its phase, area, P0–P3 priority, proposed owner, acceptance criteria, and dependencies; the proposed personal names below are **not** GitHub account assignments.

## Parent issues and sequence

| Issue title | Phase | Proposed owner | Exit condition |
| --- | --- | --- | --- |
| V1 / Beta readiness | V1 / Beta | Unassigned | Blocking app, firmware, manufacturing and QA work linked and accepted. |
| Beta & store release | V1 / Beta | Unassigned | Signed beta, feedback, store readiness and go/no-go evidence linked. |
| V2 | V2 | Unassigned | Research decisions and approved follow-on work linked. |
| V3 | V3 | Unassigned | API automation, linked control and voice work linked. |
| Ongoing product work | Ongoing | Unassigned | Site, documentation, support and compliance work linked. |

The release dependency path is: V1 blockers → app + firmware + hardware QA → signed beta → field feedback → documented 100-unit pilot decision → market-specific compliance gates before import/distribution/sale → commercial launch. V2 and V3 product implementation follows the relevant research and product decisions, and may be scheduled independently of commercial launch when safe.

## V1 / Beta — Itay

| Title | Priority | Area | Acceptance / dependency |
| --- | --- | --- | --- |
| Define factory flashing workflow and Excel input contract | P0 | Manufacturing | Specify allowed columns, validation, uniqueness, output artifacts and rejection behavior using the real flasher; depends on manufacturing input samples with test data. |
| Support new board and needle fixtures in factory flashing | P0 | Manufacturing | Confirm fixture mapping, 8/16 MB profiles, failure reporting and a test flash on each supported variant. |
| Generate and verify per-device provisioning QR image | P0 | Manufacturing | Produce one QR per device; verify scan and provenance with test material; prevent credentials from entering issues, logs or exports. |
| Complete Auto Open app-to-gate behavior and safety review | P0 | Mobile | Follow `docs/WIFIGATE_AUTO_OPEN.html`; demonstrate enrollment, permissions, disabled/default state, timeout, duplicate detection and safe failure on both platforms and supported firmware. Depends on gate-side implementation. |
| Audit AsyncStorage fields and migrate sensitive local data | P0 | Mobile | Inventory keys and risk, choose field-specific storage, migrate without data loss, test sign-out/reinstall/upgrade; no blanket encryption assumption. |
| Prove native-build, app-update and firmware-FOTA release paths | P0 | DevOps | Document distinct paths, environment boundaries, rollback/recovery and device evidence. Do not call EAS profiles OTA channels without configuration. |
| Validate explicit toggle target commands end to end | P0 | Firmware | Confirm mobile–firmware contract for ON/OFF, unknown state, duplicates, disconnect and late response on resident and guest paths. Existing mobile unit tests cover source logic only. |
| Complete firmware integration and versioned error contract | P0 | Firmware | Version the command/error contract and validate app handling against test gates. |
| Run joint firmware and hardware QA on Android and iOS | P0 | QA | Record device/PCB/firmware matrix, relay outcomes, blockers and redacted evidence. Depends on firmware and app integration. |

## V1 / Beta — Oriel

| Title | Priority | Area | Acceptance / dependency |
| --- | --- | --- | --- |
| Polish loading, success and failure animations | P1 | Mobile | Verify current drawn glyphs, timeout, accessibility, reduced motion and performance on physical Android/iOS devices. |
| Redesign the WiFiGate API page in the app | P1 | Mobile | Audit the existing page and `public/WIFIGATE_API.html`; document desired flows, then implement and verify. Star rating requires a separate product decision. |
| Edit and approve app copy before expanding translations | P1 | Mobile | Inventory strings, resolve duplicate/unclear phrasing and approve source copy across core flows. |
| Build complete app localization infrastructure | P1 | Mobile | Translation keys, default language, switch and persistence, fallback, interpolation, formats, RTL and missing-key detection. Current auth copy supports eight languages while the selector lists 39 with English fallback. |
| Confirm the 39-language product and website target list | P1 | Website | Compare `src/i18n/languagePreviewOptions.ts`, `src/i18n/wifigateWebsiteLinks.ts` and the actual website source; approve the exact list and translation scope before counting completion. |
| Close app flows on supported devices and offline states | P0 | Mobile | Check screen sizes, supported OS versions, permission refusal, background return, disconnected gate and no-network behavior. |
| Run Android and iOS sanity, regression, install and upgrade campaign | P0 | QA | Record build/device matrix, run results and reproducible bug issues with redacted evidence. |
| Set up and validate Oriel's flashing station | P1 | Manufacturing | Document equipment, installation and workflow, then verify a successful test flash and QR scan. Depends on the factory flashing workflow. |

### Language tasks after target-list approval

Create one issue per confirmed language for translation in context, long screens, RTL where relevant, and parity with the website. The **candidate** list below is in the mobile source; website source still needs confirmation. The mobile app presently has full auth-language support only for `en`, `he`, `es`, `pt`, `pl`, `ar`, `ru`, `cs`; the other selector entries currently fall back to English copy.

`en` English; `es` Spanish; `fr` French; `de` German; `he` Hebrew; `nl` Dutch; `it` Italian; `pt` Portuguese; `pl` Polish; `no` Norwegian; `cs` Czech; `ru` Russian; `uk` Ukrainian; `tr` Turkish; `ar` Arabic; `hi` Hindi; `bn` Bengali; `mr` Marathi; `te` Telugu; `zh-hans` Chinese (Simplified); `zh-hant` Chinese (Traditional); `ja` Japanese; `ko` Korean; `da` Danish; `sv` Swedish; `el` Greek; `ro` Romanian; `hr` Croatian; `fi` Finnish; `bg` Bulgarian; `sr` Serbian; `sk` Slovak; `sl` Slovenian; `id` Indonesian; `th` Thai; `vi` Vietnamese; `ms` Malay; `fil` Filipino; `hu` Hungarian.

## QA, environments and distribution

| Title | Priority | Area | Acceptance / dependency |
| --- | --- | --- | --- |
| Verify and document development, reset, site and EAS commands | P1 | Documentation | Use `docs/DEVELOPMENT_AND_RELEASE.md`; confirm each command's path, platform, data deletion and prerequisites. Resolve the missing `npm run dev` website command in that repository. |
| Maintain Android/iOS and gate hardware QA matrix | P0 | QA | Cover identity, provisioning, gate control, roles, firmware recovery, accessibility and hardware variants; attach redacted run evidence. |
| Add automated integration checks beyond source and unit tests | P1 | QA | Define meaningful emulator/device tests and hardware fixtures before adding a required CI check. The current CI is not E2E. |
| Establish post-merge sanity without devices | P1 | DevOps | Add only tests runnable against production-like test configuration without a phone or gate; keep physical checks in the QA matrix. |
| Configure and validate manual EAS test builds | P0 | DevOps | Supply `EXPO_TOKEN` secret and EAS credentials, then run `eas-build-manual` once per supported platform/profile; link successful build runs. |
| Separate development, preview and production settings | P0 | DevOps | Inventory server addresses, EAS environments, secrets, firmware FOTA paths and test data; configure and verify explicit isolation. |
| Define Android and TestFlight beta distribution | P0 | DevOps | Verify account access, signing, testers, privacy and build profile; record release owner and rollback before opening distribution. |
| Complete store readiness and go/no-go checklist | P0 | QA | Link evidence for tests, versions, permissions, privacy, store material, release notes and decision. |
| Establish beta feedback intake and bug triage | P1 | QA | Provide a redacted report form and issue linking; classify severity and decide pre-production fixes. |
| Plan a 100-unit manufacturing pilot after beta | P1 | Manufacturing | Set yield, traceability, flashing, acceptance and rejection criteria; record decision after beta validation. No purchase order. |
| Plan partnerships and sales after beta | P2 | Business | Identify target channels and outreach criteria; wait for product and market approval. |

## V2

| Title | Proposed owner | Priority | Area | Acceptance / dependency |
| --- | --- | --- | --- | --- |
| Audit current website and identify the exact ADC design reference | Itay | P2 | Website | Capture site baseline, source and approved reference; define measurable redesign scope. |
| Implement approved website redesign | Itay | P2 | Website | Implement only after reference and design approval; verify mobile, accessibility and all supported site languages. |
| Research Apple CarPlay eligibility and safety | Oriel | P2 | Compliance | Record platform eligibility, permitted use cases and driving safety review; product decision required before implementation. |
| Implement an approved CarPlay experience | Oriel | P3 | Mobile | Depends on successful eligibility/safety research and documented product approval; test in supported environment. |
| Research Android Auto eligibility and safety | Oriel | P2 | Compliance | Record platform eligibility, permitted use cases and driving safety review; product decision required before implementation. |
| Implement an approved Android Auto experience | Oriel | P3 | Mobile | Depends on successful eligibility/safety research and documented product approval; test in supported environment. |

## V3

| Title | Proposed owner | Priority | Area | Acceptance / dependency |
| --- | --- | --- | --- | --- |
| Define WiFiGate Automation API and guest lifecycle | Itay | P2 | Business | Audit `public/WIFIGATE_GUESTS_API_KEY.html` and `public/WIFIGATE_API.html`; define hotel, garage and guest-house use cases, tenant model, versioning and failure behavior. |
| Design Automation API credentials and authorization | Itay | P0 | Compliance | Specify least privilege, issuance, rotation, expiry and storage without placing keys in source or issues. Depends on API contract. |
| Implement guest access creation, revocation and audit | Itay | P2 | Firmware | Decide app/gate/server boundaries and prove guest expiry, revocation, audit and offline semantics. Depends on API and auth decisions. |
| Test and document WiFiGate Automation | Itay | P2 | QA | Cover auth, lifecycle, rate limits, failure, privacy and support documentation against a test setup. |
| Define and implement Linked Control under Dual Control | Oriel | P2 | Mobile | Specify per-gate permission, partial success, timeout and retry; validate against two physical gates. |
| Research Siri Shortcuts and Android voice shortcuts | Oriel | P2 | Mobile | Verify supported integration, identity checks and accidental activation prevention separately for each platform. |
| Implement approved Siri Shortcut control | Oriel | P3 | Mobile | Depends on Siri research and product safety decision; test confirmation and unauthorized invocation. |
| Implement approved Android voice shortcut control | Oriel | P3 | Mobile | Depends on Android voice research and product safety decision; test confirmation and unauthorized invocation. |

## Ongoing product, website and documentation

| Title | Priority | Area | Acceptance / dependency |
| --- | --- | --- | --- |
| Produce a short video or animation for each primary website use case | P2 | Website | Confirm variants on the actual site, then publish accessible, captioned media with approved claims. |
| Produce an installation-loop GIF | P2 | Website | Demonstrate the approved installation flow and include accessible text alternative. |
| Replace the homepage video with approved production footage | P2 | Website | Resolve the exact meaning and owner of the “אפרימה?” note before commissioning; check captions and claims. |
| Review possible IP or patent protection with a specialist | P2 | Business | Obtain qualified advice and document options; do not assert a patent exists. |
| Write a current datasheet, spec sheet and user manual | P1 | Documentation | Verify hardware revision, firmware/app compatibility, limits and safety claims with engineering. |
| Write installation instructions and wiring diagrams | P0 | Documentation | Qualified reviewer approves electrical and safety content before distribution. |
| Establish post-launch support and maintenance | P2 | Business | Define intake, severity, version support, feedback loop and basic service metrics. |

## Manufacturing, documents and compliance research

Each item below is a distinct research or evidence task. A qualified reviewer must decide the exact applicable requirement and timing for each target market. Where a requirement applies before import or distribution, place its issue in that gate; do not defer it until after commercial sale.

| Title | Priority | Area | Acceptance / dependency |
| --- | --- | --- | --- |
| Update product documents for ESP32-C6-WROOM-1 | P1 | Documentation | Replace stale module references and obtain engineering review. |
| Collect and verify CE/FCC evidence for PCB and finished product | P0 | Compliance | Separate module, PCB and end-product evidence; link actual controlled documents. |
| Approve product label content and placement | P0 | Compliance | Verify identifiers, market marks and traceability with qualified reviewer. |
| Produce professional installer guide | P0 | Documentation | Cover supported wiring, setup, testing and failure response; obtain qualified review. |
| Perform EMC pre-compliance tests | P0 | Compliance | Record test setup, measured results, failures and remediation. |
| Determine Israeli Ministry of Communications submission path | P0 | Compliance | Confirm whether and when submission is needed before import/distribution, and collect required documents. |
| Determine SII and customs import requirements | P0 | Compliance | Record classification and required evidence with a qualified customs contact before import. |
| Prepare an EU Declaration of Conformity if applicable | P0 | Compliance | Establish applicable directives/standards and supporting test evidence before signing. |
| Verify FCC markings and manual statements | P0 | Compliance | Review the applicable authorization path and exact required wording with a qualified reviewer. |
| Confirm relay output scope as SELV / dry contact only | P0 | Hardware | Hardware engineer verifies circuit and installation limits before stating them in docs. |
| Review gate safety warnings and anti-bypass instructions | P0 | Compliance | Qualified reviewer approves warnings and supported installation use cases. |
| Evaluate product liability insurance before commercial sale | P1 | Business | Obtain coverage recommendation and document decision. |
| Determine applicable CE, FCC and RED standards with specialists | P0 | Compliance | Record jurisdiction, product variants, standard versions and evidence gaps. |
| Determine wireless equipment trade licensing needs | P0 | Compliance | Obtain jurisdiction-specific advice before regulated distribution. |
| Classify product with SII and customs | P0 | Compliance | Record classification and its impact on import approvals. |
| Determine e-waste and battery obligations | P1 | Compliance | Review target-market obligations and record responsible entity and evidence. |

## Open gaps to resolve in GitHub

- Search existing projects, issues, labels and milestones before publishing this inventory. Preserve links and avoid duplicates.
- Verify which GitHub accounts correspond to Itay and Oriel before assignment. Until then keep them as proposed owners in the issue bodies.
- Confirm the separate firmware, website and factory-flasher repositories and their current state. This checkout is the mobile repository even though the workbook describes an older local path layout.
- Record the real project link, issue links, milestones, field values and view filters after creation. Project views and automations may need account-level permissions.
- Do not set branch protection until the required checks pass on the target branch.
