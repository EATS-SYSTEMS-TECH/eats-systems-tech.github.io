// One decorative layer per accepted video frame. CSS keeps it hidden while
// the frame shows a poster; standalone photos are never wrapped or branded.
export const WATERMARK_ASSET = "assets/img/wifigate-watermark.png";
export const WATERMARK_SHA256 = "d4e6db34dc50bf420d3629308f6f22143fe2e20c85901b19d5153a3bf9129705";
export const WATERMARK_VERSION = "20261018w3";

const existingFrames = [
  ".home-en #home > .hero__media",
  ".niche-page .niche-hero__media",
].join(", ");

export function applyMediaWatermarks($, { assetPrefix }) {
  const frames = $(existingFrames);
  frames.each((_, element) => {
    const frame = $(element);
    if (!frame.children("video[data-video-src]").length || frame.children("[data-media-watermark]").length) return;
    frame.attr("data-media-watermark-frame", "");
    frame.append($("<span>").addClass("media-watermark").attr({ "data-media-watermark": "", "aria-hidden": "true" }));
  });
  if (!$("[data-media-watermark]").length) return;
  if (!$("link[data-media-watermark-style]").length) {
    $("head").append($("<link>").attr({ rel: "stylesheet", href: `${assetPrefix}css/media-watermark.css?v=${WATERMARK_VERSION}`, "data-media-watermark-style": "" }));
  }
}
