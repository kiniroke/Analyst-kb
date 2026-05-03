const normalizeTitle = require("./normalizeTitle");

function createBigrams(text) {
  const normalized = normalizeTitle(text);
  if (!normalized) {
    return [];
  }
  const compact = normalized.replace(/\s+/g, " ");
  if (compact.length < 2) {
    return [compact];
  }
  const result = [];
  for (let index = 0; index < compact.length - 1; index += 1) {
    result.push(compact.slice(index, index + 2));
  }
  return result;
}

function similarity(a, b) {
  const left = createBigrams(a);
  const right = createBigrams(b);

  if (!left.length || !right.length) {
    return 0;
  }

  const counts = new Map();
  for (const token of left) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }

  let intersection = 0;
  for (const token of right) {
    const existing = counts.get(token) || 0;
    if (existing > 0) {
      counts.set(token, existing - 1);
      intersection += 1;
    }
  }

  return (2 * intersection) / (left.length + right.length);
}

module.exports = similarity;
