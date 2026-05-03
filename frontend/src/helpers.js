export function formatDate(value) {
  if (!value) return "Not set";
  return new Date(value).toLocaleString();
}

export function formatShortDate(value) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString();
}

export function formatPercent(value) {
  return `${Number(value || 0).toFixed(2)}%`;
}

export function humanizeEnum(value, options = {}) {
  const { titleCase = false } = options;
  const raw = String(value || "").trim();
  if (!raw) return "";

  const upper = raw.toUpperCase();
  if (upper === "TODO") return "TO DO";

  const text = raw.replaceAll("_", " ");
  if (!titleCase) return text;

  return text
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      if (word === "csi") return "CSI";
      if (word === "api") return "API";
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export async function copyText(text) {
  const value = text || "";

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return true;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
  return true;
}

export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

export function downloadText(text, filename, type = "text/plain") {
  downloadBlob(new Blob([text], { type }), filename);
}

export function createSampleCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return [headers.join(","), ...rows.map((row) => headers.map((header) => `"${String(row[header] ?? "").replaceAll('"', '""')}"`).join(","))].join("\n");
}
