function escapeValue(value) {
  const stringValue = value === null || value === undefined ? "" : String(value);
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function buildCsv(rows) {
  if (!rows.length) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const headerLine = headers.map(escapeValue).join(",");
  const lines = rows.map((row) => headers.map((header) => escapeValue(row[header])).join(","));
  return [headerLine, ...lines].join("\n");
}

function sendCsv(res, filename, rows) {
  const csv = buildCsv(rows);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(csv);
}

module.exports = {
  buildCsv,
  sendCsv,
};
