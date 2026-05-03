function normalizeUrl(input, baseUrl) {
  if (!input) {
    return "";
  }

  try {
    const resolved = baseUrl ? new URL(input, baseUrl) : new URL(input);
    resolved.hash = "";
    if ((resolved.protocol === "http:" && resolved.port === "80") || (resolved.protocol === "https:" && resolved.port === "443")) {
      resolved.port = "";
    }
    const pathname = resolved.pathname.replace(/\/+$/, "") || "/";
    resolved.pathname = pathname;
    return resolved.toString();
  } catch (error) {
    return String(input).trim();
  }
}

module.exports = normalizeUrl;
