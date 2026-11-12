// The WIFIGATE Host and WIFIGATE Manager heroes keep the shared use-case
// structure (full-width media layer, overlay, top bar with breadcrumb and
// pager, text at the bottom start, one replay action) but show the approved
// white line animation instead of a video, in a light theme.
//
// Generated hero, after fillUseCaseBody:
//   section.niche-hero.niche-hero--line[data-line-hero=<scene>][data-line-hero-state=poster]
//     .niche-hero__media
//       .line-hero__stage[data-line-hero-stage]
//         picture > source(prefers-reduced-motion: still frame) + img#niche-image (start frame)
//         (js/line-hero.js adds svg.line-hero__art, aria-hidden, over the frame)
//       .niche-hero__overlay
//     .niche-hero__content: top bar pager > .scene-video-controls > [data-scene-pause][hidden]
//                                                                  + [data-hero-text-toggle][hidden]
//                           .niche-hero__text#niche-hero-text (controlled by the toggle)
//                             .niche-hero__actions > #niche-hero-replay[data-scene-replay]
//     script[data-scene-copy]
// The text toggle collapses the eyebrow, title, lead and replay action (and
// their scrim) so the art can be seen whole; the h1 stays in the HTML and the
// layout. applyMediaWatermarks gives the media layer the same decorative mark
// as the video heroes (css/media-watermark.css draws it dark on this white
// hero once the live art is mounted).
import { sceneAssetUrl } from "./scene-media.mjs";
import { LINE_HERO_SCENES } from "./line-hero-frames.mjs";

export const LINE_HERO_VERSION = "20261113lh8";

export function applyLineHero($, { scene, frames, assetPrefix, copy }) {
  if (!["play", "pause", "replay", "hideText", "showText"].every(key => typeof copy?.[key] === "string" && copy[key].trim())) throw new Error("Missing localized scene controls");
  const frame = frames?.get?.(scene);
  if (!frame?.start || !frame?.still) throw new Error(`Line hero frames are required for ${scene}`);
  const hero = $(".niche-hero"), media = hero.children(".niche-hero__media"), image = media.find("#niche-image");
  if (hero.length !== 1 || media.length !== 1 || image.length !== 1) throw new Error("Use-case hero media is missing");

  hero.addClass("niche-hero--line").attr({ "data-line-hero": scene, "data-line-hero-state": "poster" });
  // The image keeps its id and localized alt; it now shows the scene's own
  // first frame (or its still frame when the visitor prefers reduced motion).
  image.removeClass("niche-hero__bg").addClass("line-hero__frame")
    .attr({ src: sceneAssetUrl(assetPrefix, frame.start), width: "1600", height: "900", loading: "eager", fetchpriority: "high", decoding: "async" });
  const picture = $("<picture>").append($("<source>").attr({ media: "(prefers-reduced-motion: reduce)", srcset: sceneAssetUrl(assetPrefix, frame.still), type: "image/svg+xml" }));
  image.replaceWith($("<div>").addClass("line-hero__stage").attr("data-line-hero-stage", "").append(picture));
  picture.append(image);

  // One primary action restarts the loop; pause/resume joins the top bar pager.
  const actions = hero.find(".niche-hero__actions");
  if (actions.length !== 1) throw new Error("Use-case hero actions are missing");
  actions.empty().append($("<button>").attr({ type: "button", id: "niche-hero-replay", "data-scene-replay": "" })
    .addClass("btn btn--primary niche-hero__btn-primary").attr({ "aria-label": copy.replay, title: copy.replay }).text(copy.replay));
  const pager = hero.find(".niche-hero__pager");
  if (pager.length !== 1) throw new Error("Use-case hero pager is missing");
  // The text toggle sits next to pause: shown by js/line-hero.js (it needs
  // script), expanded by default, its name and icon following its state.
  const text = hero.find(".niche-hero__content > .niche-hero__text");
  if (text.length !== 1) throw new Error("Use-case hero text block is missing");
  text.attr("id", "niche-hero-text");
  const toggle = $("<button>").attr({ type: "button", "data-hero-text-toggle": "", "aria-controls": "niche-hero-text", "aria-expanded": "true", "aria-label": copy.hideText, title: copy.hideText, hidden: "" })
    .append(`<svg class="line-hero__toggle-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path class="line-hero__toggle-hide" d="M5 4.5l5 5 5-5M5 10.5l5 5 5-5"/><path class="line-hero__toggle-show" d="M5 9.5l5-5 5 5M5 15.5l5-5 5 5"/></svg>`);
  pager.prepend($("<div>").addClass("scene-video-controls").append($("<button>").attr({ type: "button", "data-scene-pause": "", hidden: "" }).text(copy.pause), toggle));
  hero.append($("<script>").attr({ type: "application/json", "data-scene-copy": "" }).text(JSON.stringify(copy).replace(/</g, "\\u003c")));

  $("link[href*='css/niche.css']").after(`<link rel="stylesheet" href="${assetPrefix}css/line-hero.css?v=${LINE_HERO_VERSION}" />`);
  // The scene's own module; several scenes may share one.
  if (!LINE_HERO_SCENES[scene]) throw new Error(`Unknown line hero scene ${scene}`);
  $("head").append(`<link rel="modulepreload" href="${assetPrefix}${LINE_HERO_SCENES[scene].module}?v=${LINE_HERO_VERSION}" />`);
  $("head").append(`<script type="module" src="${assetPrefix}js/line-hero.js?v=${LINE_HERO_VERSION}"></script>`);
}
