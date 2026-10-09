# Host dashboard review

The recommendations have an implemented follow-up: [dashboard build guide](dashboard-build.md). This review describes the earlier inspected state.

The complete cross-repository product, UX and authorization review is maintained in the backend repository:

[WIFIGATE Host dashboard: review and product guide](../../wifigate_host/docs/dashboard-review.md)

This is a sibling-workspace link: the backend must be checked out alongside this frontend as `wifigate_host`. The review is dated 2026-10-09 and records the exact frontend/backend commits inspected, screenshot evidence, existing screen/API support, role boundaries, manual click-through checks and a prioritized improvement plan.

Main recommendations:

- Keep Calendar, Reservations, Properties/Rooms and Systems as daily work.
- Rename Access Keys to Systems, Jobs Calendar to Operations, Invoices to Billing statements, and Staff to Team.
- Consolidate derived guest lists, invitations and advanced operational settings into focused views.
- Separate platform administration from organization management, preserving server-side permissions and MFA.
- First fix secondary Operations failures clearing the calendar and blue-on-blue guest-name buttons.

These are documented recommendations, not implemented UI changes. No endpoint or production data changed during the review.
