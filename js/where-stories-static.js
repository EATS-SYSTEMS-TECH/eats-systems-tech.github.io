// /js/where-stories-static.js
// Version: 1.0.0

let staticWhereStoryState = {
  activeKey: null,
  initialized: false,
  data: null,
};

function getStaticWhereStoryData() {
  if (staticWhereStoryState.data) {
    return staticWhereStoryState.data;
  }

  const dataScript = document.getElementById("where-story-data");
  if (!dataScript) {
    staticWhereStoryState.data = { stories: {}, ui: {}, anchorToKey: {} };
    return staticWhereStoryState.data;
  }

  try {
    staticWhereStoryState.data = JSON.parse(dataScript.textContent || "{}");
  } catch (error) {
    staticWhereStoryState.data = { stories: {}, ui: {}, anchorToKey: {} };
  }

  return staticWhereStoryState.data;
}

function getStaticWhereStoryLink(storyKey) {
  if (!staticWhereStoryState.links || !staticWhereStoryState.links.length) {
    return null;
  }

  return staticWhereStoryState.links.find((link) => link.dataset.storyKey === storyKey) || null;
}

function updateStaticWhereStoryLinkState(activeKey) {
  if (!staticWhereStoryState.links || !staticWhereStoryState.links.length) {
    return;
  }

  staticWhereStoryState.links.forEach((link) => {
    const isActive = link.dataset.storyKey === activeKey;
    link.classList.toggle("is-active", isActive);
    link.setAttribute("aria-expanded", isActive ? "true" : "false");
  });
}

function updateStaticWhereStoryHash(nextHash) {
  try {
    if (history.pushState) {
      history.pushState(null, "", nextHash);
    } else {
      window.location.hash = nextHash;
    }
  } catch (error) {
    // Ignore history update failures.
  }
}

function hideStaticWhereStory(options = {}) {
  if (!staticWhereStoryState.initialized || !staticWhereStoryState.panel) {
    return;
  }

  const { focusTrigger = false, updateHash = false } = options;
  const previousKey = staticWhereStoryState.activeKey;

  staticWhereStoryState.panel.hidden = true;
  staticWhereStoryState.activeKey = null;
  updateStaticWhereStoryLinkState(null);

  if (updateHash) {
    updateStaticWhereStoryHash("#where");
  }

  if (focusTrigger && previousKey) {
    const link = getStaticWhereStoryLink(previousKey);
    if (link) {
      link.focus();
    }
  }
}

function renderStaticWhereStory(storyKey, options = {}) {
  if (!staticWhereStoryState.initialized || !storyKey) {
    return;
  }

  const data = getStaticWhereStoryData();
  const story = data.stories?.[storyKey];
  const ui = data.ui || {};

  if (!story) {
    return;
  }

  staticWhereStoryState.panel.hidden = false;
  staticWhereStoryState.panel.setAttribute("data-story-key", storyKey);
  staticWhereStoryState.card.id = story.anchorId || `where-story-${storyKey}`;
  staticWhereStoryState.card.setAttribute("data-story-key", storyKey);
  staticWhereStoryState.title.textContent = story.title || storyKey;
  staticWhereStoryState.winLabel.textContent = ui.winLabel || "Why teams choose it";
  staticWhereStoryState.video.label.textContent = ui.videoLabel || "Demo video";
  staticWhereStoryState.video.status.textContent = ui.videoStatus || "Coming soon";
  staticWhereStoryState.video.note.textContent = ui.videoNote || "";
  staticWhereStoryState.pitch.textContent = story.pitch || "";
  staticWhereStoryState.labels.problem.textContent = ui.problem || "Operational need";
  staticWhereStoryState.labels.solution.textContent = ui.solution || "Why WiFiGate fits";
  staticWhereStoryState.fields.problem.textContent = story.problem || "";
  staticWhereStoryState.fields.solution.textContent = story.solution || "";
  staticWhereStoryState.fields.value.textContent = story.value || "";
  staticWhereStoryState.activeKey = storyKey;

  updateStaticWhereStoryLinkState(storyKey);

  if (options.updateHash !== false) {
    updateStaticWhereStoryHash(`#${story.anchorId || `where-story-${storyKey}`}`);
  }
}

function getStaticWhereStoryKeyFromHash(hashValue) {
  const hash = (hashValue || "").replace(/^#/, "");
  if (!hash) {
    return null;
  }

  const data = getStaticWhereStoryData();
  return data.anchorToKey?.[hash] || null;
}

function syncStaticWhereStoryFromHash() {
  const storyKey = getStaticWhereStoryKeyFromHash(window.location.hash);
  if (!storyKey) {
    if (staticWhereStoryState.activeKey) {
      hideStaticWhereStory({ updateHash: false });
    }
    return;
  }

  renderStaticWhereStory(storyKey, { updateHash: false });
}

function setupStaticWhereStories() {
  if (staticWhereStoryState.initialized) {
    return;
  }

  const root = document.getElementById("where");
  if (!root) {
    return;
  }

  const links = Array.from(root.querySelectorAll(".where-list__link[data-story-key]"));
  const panel = document.getElementById("where-story-panel");
  const card = document.getElementById("where-story-card");

  if (!links.length || !panel || !card) {
    return;
  }

  staticWhereStoryState.root = root;
  staticWhereStoryState.links = links;
  staticWhereStoryState.panel = panel;
  staticWhereStoryState.card = card;
  staticWhereStoryState.title = document.getElementById("where-story-title");
  staticWhereStoryState.pitch = document.getElementById("where-story-pitch");
  staticWhereStoryState.winLabel = document.getElementById("where-story-win-label");
  staticWhereStoryState.video = {
    label: document.getElementById("where-story-video-label"),
    status: document.getElementById("where-story-video-status"),
    note: document.getElementById("where-story-video-note"),
  };
  staticWhereStoryState.labels = {
    problem: document.getElementById("where-story-label-problem"),
    solution: document.getElementById("where-story-label-solution"),
  };
  staticWhereStoryState.fields = {
    problem: document.getElementById("where-story-problem"),
    solution: document.getElementById("where-story-solution"),
    value: document.getElementById("where-story-value"),
  };

  if (
    !staticWhereStoryState.title ||
    !staticWhereStoryState.pitch ||
    !staticWhereStoryState.winLabel ||
    !staticWhereStoryState.video.label ||
    !staticWhereStoryState.video.status ||
    !staticWhereStoryState.video.note ||
    !staticWhereStoryState.labels.problem ||
    !staticWhereStoryState.labels.solution ||
    !staticWhereStoryState.fields.problem ||
    !staticWhereStoryState.fields.solution ||
    !staticWhereStoryState.fields.value
  ) {
    return;
  }

  staticWhereStoryState.initialized = true;

  links.forEach((link) => {
    const storyKey = link.dataset.storyKey;
    if (!storyKey) {
      return;
    }

    link.addEventListener("click", (event) => {
      event.preventDefault();

      if (staticWhereStoryState.activeKey === storyKey && !staticWhereStoryState.panel.hidden) {
        hideStaticWhereStory({ updateHash: true });
        return;
      }

      renderStaticWhereStory(storyKey);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && staticWhereStoryState.activeKey) {
      hideStaticWhereStory({ focusTrigger: true, updateHash: true });
    }
  });

  document.addEventListener("click", (event) => {
    if (
      !staticWhereStoryState.activeKey ||
      staticWhereStoryState.panel.hidden ||
      !staticWhereStoryState.card ||
      !staticWhereStoryState.card.isConnected
    ) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    if (target.closest("#where-story-card") || target.closest(".where-list__link[data-story-key]")) {
      return;
    }

    hideStaticWhereStory({ updateHash: true });
  });

  window.addEventListener("hashchange", syncStaticWhereStoryFromHash);
  syncStaticWhereStoryFromHash();
}

document.addEventListener("DOMContentLoaded", setupStaticWhereStories);