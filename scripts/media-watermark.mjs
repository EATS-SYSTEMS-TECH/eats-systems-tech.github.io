// One decorative layer per accepted video frame, and per WIFIGATE Host /
// Manager line-animation hero (owner request, 10 Nov 2026). CSS keeps it
// hidden while the frame shows a poster or the static no-JavaScript frame;
// standalone photos are never wrapped or branded.
// The supplied PNG (assets/img/wifigate-watermark.png) cropped to the window the
// layer always showed and sized for its largest display, as lossless WebP.
export const WATERMARK_ASSET = "assets/img/wifigate-watermark.webp";
export const WATERMARK_SHA256 = "5e918aed6fa3108370ff2222b61dbcc0739ed4f9eb821bd6df7227c61f95ccfe";
export const WATERMARK_VERSION = "20261110w2";

const existingFrames = [
  ".home-en #home > .hero__media",
  ".niche-page .niche-hero__media",
].join(", ");

export function applyMediaWatermarks($, { assetPrefix }) {
  const frames = $(existingFrames);
  frames.each((_, element) => {
    const frame = $(element);
    const media = frame.children("video[data-video-src]").length || (frame.parent().is(".niche-hero--line") && frame.children("[data-line-hero-stage]").length);
    if (!media || frame.children("[data-media-watermark]").length) return;
    frame.attr("data-media-watermark-frame", "");
    frame.append($("<span>").addClass("media-watermark").attr({ "data-media-watermark": "", "aria-hidden": "true" }));
  });
  if (!$("[data-media-watermark]").length) return;
  if (!$("link[data-media-watermark-style]").length) {
    $("head").append($("<link>").attr({ rel: "stylesheet", href: `${assetPrefix}css/media-watermark.css?v=${WATERMARK_VERSION}`, "data-media-watermark-style": "" }));
  }
}
