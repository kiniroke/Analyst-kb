function escapeValue(value) {
  const stringValue = value === undefined || value === null ? "" : String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function createCsv(rows) {
  if (!rows.length) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const lines = rows.map((row) => headers.map((header) => escapeValue(row[header])).join(","));
  return [headers.map(escapeValue).join(","), ...lines].join("\n");
}

module.exports = createCsv;
