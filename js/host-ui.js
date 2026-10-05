export const node = (tag, text, attrs = {}) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
  return element;
};
export function downloadHostCsv(items, fields, filename) {
  const cell = value => { const text = String(value ?? ""), safe = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text; return `"${safe.replaceAll('"', '""')}"`; };
  const csv = [fields, ...items.map(item => fields.map(field => item[field]))].map(row => row.map(cell).join(",")).join("\r\n") + "\r\n";
  downloadHostTextCsv(csv, filename);
}
export function downloadHostTextCsv(csv, filename) {
  if (typeof csv !== "string" || csv.length > 2097152) throw new Error("invalid-export");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })), link = node("a", undefined, { href: url, download: filename }); document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
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
