// /js/utils.js
// Version: 1.2.0

function $(selector, scope = document) {
  return scope.querySelector(selector);
}

function getNestedTranslation(obj, path) {
  return path.split(".").reduce((current, key) => current?.[key], obj);
}

function $$(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}
