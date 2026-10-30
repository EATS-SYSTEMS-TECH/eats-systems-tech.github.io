# Homepage media browser regression runner

Reconstruct the browser runner independently, keeping every existing behavior
assertion. The runner opens the checked-in Hebrew homepage in actual installed
Chrome, with isolated contexts, declined analytics consent and the real video.
Each context and the browser must close even when a check fails. This work
changes test infrastructure only; product scripts, templates, assets, manifests,
dependency locks and generated pages remain unchanged.

Keep nine independent scenarios:

1. Desktop autoplay downloads media; a click pauses; resizing does not undo
   the pause; Enter on the primary control resumes.
2. Phone autoplay is muted, initially muted, inline and non-looping. Its single
   visible primary control has an unobstructed hit target at least 44px tall.
   After seeking the actual clip to three seconds, pause and Enter resume keep
   the position and update the control's playing state. Wait for the actual
   clip to end, without dispatching an ended event. The poster returns and
   scrolling out/back does not replay a completed clip.
3. Phone with effective connection type 3g preserves the same autoplay,
   control, pause/resume and retained-position checks.
4. Desktop with effective connection type 2g preserves those same checks.
5. Delay settlement of only the first actual play promise. Two subsequent
   primary clicks pause/resume; the older promise cannot pause the newer play.
6. Reject only the first play call with the browser's autoplay-denial error.
   The poster and visible replay remain, and explicit replay recovers.
7. OS reduced motion keeps the poster and requests no video for a 1.5 second
   observation window. Explicit replay then produces visible actual playback.
8. Stored site reduced motion has the same poster/no-download/manual-play
   contract.
9. Save-Data has that same contract. For all three preference scenarios, media
   fills the hero and the poster/video object positions and transforms match.

Read current time, pause/ended state, actual media requests and real computed
geometry from Chrome. Keep the eight-second playback readiness bound and
twenty-second actual-ended bound. Playback fault/preference fixtures are
explicit browser regression inputs; they never establish physical phone,
Bluetooth or production acceptance. Report each scenario independently.

Freeze the complete original runner outcome before deleting it in a separate
commit. Add the replacement afterward and retain both original/new outcomes.
Do not erase prior failures or weaken a check to obtain a pass.
