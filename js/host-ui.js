export const node = (tag, text, attrs = {}) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
  return element;
};
export function field(form, label, name, value = "", type = "text", options) {
  const wrapper = node("label", label);
  const input = node(options ? "select" : "input", undefined, { name, "aria-label": label });
  if (options) for (const [id, text] of options) input.append(node("option", text, { value: id }));
  else { input.type = type; input.required = true; input.maxLength = name === "email" ? 254 : 120; }
  input.value = value;
  wrapper.append(input);
  form.append(wrapper);
  return input;
}
