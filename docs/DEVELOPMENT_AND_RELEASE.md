# Development, QA, and release operations

This file records commands verified against this checkout on 2026-09-25. It does not replace the BLE, invitation, or Auto Open specifications linked from the README.

## Local commands

Run these from the repository root unless stated otherwise. `npm.cmd` is the Windows spelling of `npm` when PowerShell execution policy blocks the npm shim.

| Command | What it actually does | Prerequisites / caution |
| --- | --- | --- |
| `npm run reset:app` | Runs `scripts/reset-android-app.ps1`: clears the installed Android package's app data with `adb pm clear`, or a `run-as` cleanup fallback for a debuggable build. A missing app is skipped. | Windows PowerShell, Android SDK `adb`, an authorized USB device. This **deletes local app data** and does not itself start Metro. It does not reset iOS. |
| `npm run reset:usb` | Runs the reset above, then `scripts/start-android-usb.ps1`. | Same prerequisites. The start step is reached only if reset succeeds. |
| `npm run start:usb` | Establishes `adb reverse tcp:8081`, launches the installed app when possible, and starts or reuses the Expo dev-client Metro server on localhost. | Windows PowerShell, Android SDK, authorized USB device, installed dev build to open the app. It preserves app data. |
| `npm run start:dev-client` or `npx expo start --dev-client` | Starts Metro for a development client. | Dev build installed; phone and host must be able to reach Metro over the selected network. It preserves app data. |
| `eas build --platform android --profile development` | Requests an Android development APK from EAS. | Expo account and build credentials, EAS CLI, configured EAS environment. It does not install the build. |
| `eas build --profile development --platform all` | Requests Android and iOS development builds. | Same, plus usable iOS credentials and device provisioning for internal distribution. |
| `npx eas build -p android --profile production-apk` | Requests an internally distributed Android APK using the **production** EAS environment. | Confirm production environment values and account access before using for demonstrations. It does not submit to a store. |
| `python -m http.server 8000` | Serves the current directory as static files. | Run from `public` for this repository's static API pages, or from the actual website repository for that website. It does not run a dev bundler. |
| `npm.cmd run dev` | **No `dev` script exists** in this repository's `package.json`. | Determine the correct command from the separate website repository before documenting it there. |

`eas.json` defines `development`, `preview`, `production`, and `production-apk` build profiles. There is currently no verified `expo-updates` configuration or OTA channel mapping in `app.json`/`eas.json`; do not treat an EAS build profile as an OTA lane. Distinguish app JavaScript, native code/config, and firmware updates in each release issue. The firmware FOTA configuration visible in `app.json` is a separate gate-controller update path.

## Automated checks

- `mobile-ci` runs on every pull request and pushes to `main` or `develop`. It installs the locked dependency tree, runs `npm run verify` (ESLint and TypeScript), then `npm run test:unit`. These are source and unit checks, not mobile-device E2E tests.
- The existing `dependency-audit` gate runs on relevant dependency changes and weekly. The existing `secret-scan` runs on pull requests and pushes to `main` or `develop`.
- `eas-build-manual` is dispatch-only and supports the current development and preview profiles, plus Android `production-apk`. It waits for the EAS result. It requires the `EXPO_TOKEN` GitHub secret and a successful interactive EAS setup of each platform/profile before non-interactive use. A build does not submit or publish anything.

Do not require `mobile-ci` in branch protection until it has passed on the actual default branch and on a representative pull request. Check whether the default branch is `main` before creating a ruleset.

## Manual QA matrix

Record the app build, OS/device, firmware revision, PCB/flash variant, test gate, tester, outcome, and redacted evidence for each run. Use test provisioning material only.

| Area | Android and iOS checks | Physical boundary |
| --- | --- | --- |
| Install and identity | Fresh install, upgrade, sign-in, sign-out, denied permissions, background/foreground, no network | Verify gate access after identity changes, without exposing provisioning QR material. |
| Provisioning and invitations | Scan/accept QR and invitation, expiration, invalid link, guest/user/admin roles, migration | Confirm the device's stored role and rejection behavior. |
| Gate control | Open, explicit toggle ON/OFF, duplicate taps, delayed replies, timeout, disconnect, concurrent phones | Measure relay behavior and confirm no false success indication. |
| Firmware and recovery | Version display, update eligibility, transfer interruption, retry, rollback/recovery | Test supported 8 MB and 16 MB boards with power-loss and HIL evidence before firmware release. |
| Auto Open | Follow `docs/WIFIGATE_AUTO_OPEN.html` and its current implementation status | Test only supported hardware/firmware combinations; never infer coverage from a source build. |
| Presentation | Screen sizes, dynamic type, RTL, offline and error states, accessibility labels | Check with real devices and supported OS versions. |

## Beta to commercial release sequence

1. Close the V1 blockers and collect Android/iOS plus gate hardware QA evidence.
2. Prepare signed beta builds with the correct credentials; use the approved Android test track and TestFlight only after account and provisioning checks. Record build URLs and tester scope.
3. Triage field feedback and blocking defects. Record a go/no-go decision before expanding distribution.
4. Decide whether a 100-unit manufacturing pilot is warranted. Record yield criteria, serial tracking, flashing and acceptance procedures; do not place an order as part of this planning step.
5. Ask qualified compliance and safety reviewers to determine which approvals are required **before import, distribution, or sale** in each target market. Store any verified certificates and declarations as controlled evidence, not as claims in an issue.
6. Prepare support, website and store content, and a controlled store submission only after the relevant gates are met.

CarPlay and Android Auto are research items first. Their implementation depends on a product decision and platform-rule review. Siri and Android voice shortcuts also require an authentication and accidental-activation safety design before implementation.
