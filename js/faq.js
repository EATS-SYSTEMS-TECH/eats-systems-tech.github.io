// js/faq.js
// Smooth opening and closing for the FAQ questions (details.seo-faq__item on
// the homepage and the use-case pages): the answer slides open and closed
// instead of appearing at once. The native <details> keeps working without
// this script, and nothing animates when the visitor asked for reduced motion
// (the system setting or the accessibility menu).

(() => {
  const duration = 320;
  const easing = "cubic-bezier(0.2, 0.7, 0.2, 1)";
  const reducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.classList.contains("a11y-reduced-motion");

  function setUp(item) {
    const summary = item.querySelector("summary");
    const answer = item.querySelector(".seo-faq__answer");
    if (!summary || !answer || typeof item.animate !== "function") return;
    let animation = null;
    let timer = 0;

    const finish = (open) => {
      window.clearTimeout(timer);
      animation?.cancel();
      item.open = open;
      item.classList.remove("is-closing");
      item.style.overflow = "";
      animation = null;
    };

    // The end state never waits on the animation: a page in a background tab
    // can hold animations, so a timer settles the question as well.
    const settle = (open) => {
      animation.onfinish = () => finish(open);
      timer = window.setTimeout(() => finish(open), duration + 80);
    };

    summary.addEventListener("click", (event) => {
      if (reducedMotion()) return;
      event.preventDefault();
      const closing = item.open && !item.classList.contains("is-closing");
      const from = item.offsetHeight;
      window.clearTimeout(timer);
      animation?.cancel();
      item.style.overflow = "hidden";

      if (closing) {
        item.classList.add("is-closing");
        const to = summary.offsetHeight;
        animation = item.animate({ height: [`${from}px`, `${to}px`] }, { duration, easing });
        settle(false);
      } else {
        item.classList.remove("is-closing");
        item.open = true;
        const to = summary.offsetHeight + answer.offsetHeight;
        animation = item.animate({ height: [`${from}px`, `${to}px`] }, { duration, easing });
        answer.animate({ opacity: [0, 1], transform: ["translateY(-4px)", "none"] }, { duration, easing });
        settle(true);
      }
    });
  }

  document.querySelectorAll("details.seo-faq__item").forEach(setUp);
})();
