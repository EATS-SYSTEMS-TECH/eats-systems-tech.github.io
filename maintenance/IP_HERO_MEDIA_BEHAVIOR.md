# Homepage hero media behavior contract

Scope: `js/hero.js`, frozen at `44f223883` before its removal. This is a
source reconstruction inside W1; styles, assets, markup and the other W1 files
remain separate. Keep `setupHeroMedia` available to the existing main script.
The real Chrome suite `scripts/hero-video-browser.test.mjs` must pass before
removal and after addition. Keep its failed attempts and actual video playback
observations; a substituted media implementation is not browser acceptance.

## Required page interface and copy

The controller binds the hero section, video, eager background image, mute
action, primary replay action and its span, and optional pause action. Missing
hero, video, primary action or label means setup does nothing. Existing IDs,
classes and data attributes remain unchanged. The video starts muted, default
muted, inline and non-looping. Its lazy source comes from its existing data
attribute, with no automatic download before policy and visibility allow it.

Read the media object from the hero locale JSON script every time controls
refresh. Merge it with these unchanged English fallback values: replay is
"Play Video Again", mute is "Mute video", unmute is "Unmute video", pause is
"Pause video", and play is "Play video". Invalid JSON uses the same defaults.
The mute and optional pause controls update their data state, accessible name,
title and pressed value from the actual video. The primary action uses the
pause label while playback is active and the replay label otherwise; it also
updates the existing playing data attribute. It stays visible in both poster
and playback states. Silent media never shows the mute action. Only the video
state shows the optional pause action.

## Playback decisions and cancellation

Autoplay works on phones and desktops, including slow connections. Browser
reduced motion, site accessibility reduced motion and Save-Data suppress
automatic playback and source loading. An explicit visitor request can still
play. Automatic playback also requires an in-view hero, a visible document,
no visitor pause and no previous completion. Initial visibility is false when
IntersectionObserver exists and true otherwise. The observer uses thresholds
zero and one quarter; any intersecting entry at least one quarter is in view.

Every play request gets an epoch. Pause, poster restoration, document hiding
and viewport exit invalidate earlier requests. Before source attachment, await
the existing optional media preparation and poster decode; poster decode
failure alone does not block explicit recovery. Recheck epoch after each
await, plus automatic policy after decode. Attach the lazy source only when
needed. A restart resets completion and playback position to zero. A browser
play rejection restores the poster only if that request is still current.
An old fulfilled play must never pause a newer manual resume.

The primary action pauses currently active playback and records a visitor
pause. Otherwise it manually resumes from the same position, restarting only
when ended/completed. The separate pause action has the same manual resume
and pause semantics. Mute toggles only actual video mute state.

Actual playing switches the hero to video. Actual end records completion,
pauses, invalidates pending work and returns to the matching poster. Video
error also restores the poster. Actual pause and volume changes refresh copy.
Viewport exit and document hiding pause without turning off the video state;
reentry/showing may autoplay only if all automatic conditions still hold.
Policy changes restore the poster when disallowed, or attempt automatic play
when permitted. Listen for desktop breakpoint 769px, reduced motion,
connection changes, site accessibility changes and document visibility.

The existing body class for hero-video visibility is set only when there is
no accepted scene attribute, the hero is in view, the desktop breakpoint
matches and the hero is in video state. Refresh that class on state,
intersection and policy changes. Do not move the floating accessibility
button directly. Preserve existing poster geometry and every media asset.

## Completion evidence

Commit this contract and a green baseline before a separate removal commit.
Write the controller afresh from these requirements, with an English comment
on each functional block. Run the same actual Chrome suite, site verification,
content carry-over and a complete scoped author audit. Exact required DOM,
platform and fallback-copy facts may be individually documented; do not exempt
retained implementation. This partial W1 work does not close all W1 or publish
the website.
