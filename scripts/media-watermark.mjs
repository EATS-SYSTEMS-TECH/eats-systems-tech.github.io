// One decorative layer per displayed photo/video frame. Accepted media bytes,
// native poster selection and video controls stay under their existing owners.
export const WATERMARK_ASSET = "assets/img/wifigate-watermark.png";
export const WATERMARK_SHA256 = "d4e6db34dc50bf420d3629308f6f22143fe2e20c85901b19d5153a3bf9129705";
export const WATERMARK_VERSION = "20261018w2";

const existingFrames = [
  ".home-en #home > .hero__media",
  ".niche-page .niche-hero__media",
  ".home-en .feature-card--auto-open .feature-card__media[data-scene-video]",
  ".home-en .automation-stay__media",
  ".home-en .where-media",
  ".home-en .product-overview__figure",
].join(", ");

export function applyMediaWatermarks($, { assetPrefix }) {
  // These two photos are grid items themselves. Keep their layout class on the
  // new frame so wrapping cannot change desktop columns or the mobile measure.
  $(".home-en img.security-statement__media-image").each((_, element) => {
    const image = $(element);
    const frame = $("<div>").addClass(image.attr("class") + " media-watermark-image");
    image.removeAttr("class").addClass("media-watermark-image__image").wrap(frame);
  });
  const frames = $(existingFrames).add($(".home-en .media-watermark-image"));
  frames.each((_, element) => {
    const frame = $(element);
    if (!frame.find("img, video").length || frame.children("[data-media-watermark]").length) return;
    frame.attr("data-media-watermark-frame", "");
    frame.append($("<span>").addClass("media-watermark").attr({ "data-media-watermark": "", "aria-hidden": "true" }));
  });
  if (!$("[data-media-watermark]").length) return;
  if (!$("link[data-media-watermark-style]").length) {
    $("head").append($("<link>").attr({ rel: "stylesheet", href: `${assetPrefix}css/media-watermark.css?v=${WATERMARK_VERSION}`, "data-media-watermark-style": "" }));
  }
}
