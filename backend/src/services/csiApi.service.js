const axios = require("axios");
const { createManualBatch } = require("./csiImport.service");

async function loadFromCsiApi({ uploadedById, endpoint, method = "GET", token, cookie, payload, periodFrom, periodTo, sourceLabel }) {
  if (!endpoint) {
    const error = new Error("CSI API credentials required.");
    error.status = 400;
    throw error;
  }

  if (!token && !cookie) {
    const error = new Error("CSI API credentials required.");
    error.status = 400;
    throw error;
  }

  try {
    const response = await axios({
      url: endpoint,
      method,
      timeout: 10000,
      data: payload || undefined,
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
        Cookie: cookie || undefined,
        "User-Agent": "Parser Coverage Validator API Loader",
      },
      validateStatus: () => true,
    });

    if (response.status >= 400) {
      const error = new Error(`CSI API request failed with status ${response.status}.`);
      error.status = 400;
      error.details = typeof response.data === "string" ? response.data : JSON.stringify(response.data);
      throw error;
    }

    const rows = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.records)
      ? response.data.records
      : Array.isArray(response.data?.items)
      ? response.data.items
      : [];

    return createManualBatch({
      uploadedById,
      records: rows,
      sourceLabel: sourceLabel || "Loaded from CSI API",
      periodFrom,
      periodTo,
    });
  } catch (error) {
    if (error.status) {
      throw error;
    }
    const wrapped = new Error(`CSI API request error: ${error.message}`);
    wrapped.status = 400;
    throw wrapped;
  }
}

module.exports = {
  loadFromCsiApi,
};
