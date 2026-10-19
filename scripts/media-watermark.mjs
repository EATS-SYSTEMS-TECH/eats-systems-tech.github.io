// Video marks follow the displayed video state. Selected homepage artwork is
// also branded so its WIFIGATE mark does not disappear on mobile/static views.
export const WATERMARK_ASSET = "assets/img/wifigate-watermark.png";
export const WATERMARK_SHA256 = "d4e6db34dc50bf420d3629308f6f22143fe2e20c85901b19d5153a3bf9129705";
export const WATERMARK_VERSION = "20261019w1";

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

  const homeArtwork = [
    ".home-en .security-statement__media-image",
    ".home-en .automation-stay__media",
    ".home-en .where-media",
    ".home-en .product-overview__figure",
  ].join(", ");
  $(homeArtwork).each((_, element) => {
    let frame = $(element);
    if (frame.is("img")) {
      frame.wrap('<div class="security-statement__media-image media-watermark-image" data-media-watermark-frame=""></div>');
      frame.removeClass("security-statement__media-image").addClass("media-watermark-image__image");
      frame = frame.parent();
    } else {
      frame.addClass("media-watermark-image").attr("data-media-watermark-frame", "");
    }
    if (!frame.children("[data-media-watermark]").length) {
      frame.append($("<span>").addClass("media-watermark").attr({ "data-media-watermark": "", "aria-hidden": "true" }));
    }
  });

  if (!$('[data-media-watermark]').length) return;
  const href = `${assetPrefix}css/media-watermark.css?v=${WATERMARK_VERSION}`;
  const stylesheet = $('link[data-media-watermark-style]');
  if (stylesheet.length) stylesheet.attr("href", href);
  else $('head').append($('<link>').attr({ rel: 'stylesheet', href, 'data-media-watermark-style': '' }));
}
