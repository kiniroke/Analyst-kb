function requireFields(body, fields) {
  const missing = fields.filter((field) => {
    const value = body[field];
    return value === undefined || value === null || value === "";
  });

  return missing;
}

function toDate(value) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function parseSteps(value) {
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }
  return value;
}

module.exports = {
  requireFields,
  toDate,
  parseSteps,
};
