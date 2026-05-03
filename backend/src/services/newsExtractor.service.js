const axios = require("axios");
const cheerio = require("cheerio");
const prisma = require("../prisma");
const normalizeUrl = require("../utils/normalizeUrl");
const normalizeTitle = require("../utils/normalizeTitle");
const { parseDateValue } = require("../utils/dateParser");
const { validateSelectors } = require("./selectorValidator.service");

function toAbsoluteUrl(value, baseUrl) {
  try {
    return new URL(value, baseUrl).toString();
  } catch (error) {
    return value || "";
  }
}

function looksLikeArticleLink(url) {
  if (!url) {
    return false;
  }
  const text = url.toLowerCase();
  return /news|article|press|novosti|last|\/\d{4}\/|\d{2,}|story|item/.test(text);
}

function collectFromFallback($, pageUrl) {
  const ignored = ["telegram", "instagram", "facebook", "login", "register", "contact", "about", "privacy"];
  const results = [];
  $("a").each((index, element) => {
    const node = $(element);
    const title = node.text().replace(/\s+/g, " ").trim();
    const href = node.attr("href");
    if (!title || title.length < 12 || !href || href.startsWith("#") || href.startsWith("javascript:")) {
      return;
    }
    if (ignored.some((token) => href.toLowerCase().includes(token) || title.toLowerCase().includes(token))) {
      return;
    }
    const absoluteUrl = toAbsoluteUrl(href, pageUrl);
    if (!looksLikeArticleLink(absoluteUrl)) {
      return;
    }
    results.push({
      title,
      url: absoluteUrl,
      normalizedUrl: normalizeUrl(absoluteUrl),
      publishedAt: null,
      rawDate: null,
    });
  });
  return results;
}

function collectFromSelectors($, pageUrl, selectors) {
  const containers = selectors.containerSelector ? $(selectors.containerSelector).toArray() : [];
  const results = [];

  for (const container of containers) {
    const node = $(container);
    const titleNode = selectors.titleSelector ? node.find(selectors.titleSelector).first() : node.find("a").first();
    const linkNode = selectors.linkSelector ? node.find(selectors.linkSelector).first() : titleNode;
    const dateNode = selectors.dateSelector ? node.find(selectors.dateSelector).first() : null;
    const title = titleNode.text().replace(/\s+/g, " ").trim();
    const href = linkNode.attr("href") || titleNode.attr("href") || "";
    const absoluteUrl = href ? toAbsoluteUrl(href, pageUrl) : "";
    const rawDate = dateNode?.attr("datetime") || dateNode?.text().replace(/\s+/g, " ").trim() || "";
    const publishedAt = parseDateValue(rawDate);

    if (!title && !absoluteUrl) {
      continue;
    }

    results.push({
      title,
      url: absoluteUrl,
      normalizedUrl: normalizeUrl(absoluteUrl),
      publishedAt,
      rawDate: rawDate || null,
    });
  }

  return results;
}

function deduplicateItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.normalizedUrl || ""}::${normalizeTitle(item.title)}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function determineStatus(items) {
  const itemsWithTitle = items.filter((item) => item.title).length;
  const itemsWithUrl = items.filter((item) => item.url).length;
  const itemsWithDate = items.filter((item) => item.publishedAt).length;
  const validCount = items.filter((item) => item.title && item.url).length;

  if (validCount >= 5) {
    return itemsWithDate >= 3 ? "OK" : "WARNING";
  }

  if (items.length > 0) {
    return "WARNING";
  }

  return "ERROR";
}

async function fetchSourceHtml(pageUrl) {
  const startedAt = Date.now();
  const response = await axios.get(pageUrl, {
    timeout: 10000,
    headers: {
      "User-Agent": "Mozilla/5.0 Parser Coverage Validator",
    },
    validateStatus: () => true,
  });

  return {
    html: response.data,
    httpStatus: response.status,
    responseTimeMs: Date.now() - startedAt,
  };
}

async function executeExtraction(source, options = {}) {
  const selectors = {
    containerSelector: options.overrideSelectors?.containerSelector ?? source.containerSelector ?? "",
    titleSelector: options.overrideSelectors?.titleSelector ?? source.titleSelector ?? "",
    linkSelector: options.overrideSelectors?.linkSelector ?? source.linkSelector ?? "",
    dateSelector: options.overrideSelectors?.dateSelector ?? source.dateSelector ?? "",
  };
  const pageUrl = source.newsListUrl || source.baseUrl;

  const runData = {
    startedAt: new Date(),
    status: "ERROR",
    pageUrl,
    sourceId: source.id,
    createdById: options.createdById || null,
  };

  let run = null;
  if (options.persist !== false) {
    run = await prisma.extractionRun.create({ data: runData });
  }

  try {
    const fetched = await fetchSourceHtml(pageUrl);
    const html = typeof fetched.html === "string" ? fetched.html : JSON.stringify(fetched.html);
    const $ = cheerio.load(html || "");

    let items = [];
    let fallbackUsed = false;

    if (selectors.containerSelector) {
      items = collectFromSelectors($, pageUrl, selectors);
    }

    if (!items.length) {
      fallbackUsed = true;
      items = collectFromFallback($, pageUrl);
    }

    items = deduplicateItems(items).slice(0, 100).map((item, index) => ({
      ...item,
      position: index + 1,
      extractedAt: new Date(),
    }));

    const status = determineStatus(items);
    const itemsWithTitle = items.filter((item) => item.title).length;
    const itemsWithUrl = items.filter((item) => item.url).length;
    const itemsWithDate = items.filter((item) => item.publishedAt).length;
    const selectorDiagnostics = validateSelectors(html, selectors);

    const evidence = {
      pageUrl,
      httpStatus: fetched.httpStatus,
      responseTimeMs: fetched.responseTimeMs,
      selectors,
      fallbackUsed,
      itemsFound: items.length,
      itemsWithTitle,
      itemsWithUrl,
      itemsWithDate,
      sampleExtractedItems: items.slice(0, 5),
      selectorDiagnostics,
      errorMessage: status === "ERROR" ? "No valid news items found." : null,
    };

    if (options.persist !== false && run) {
      await prisma.extractedNewsItem.deleteMany({ where: { extractionRunId: run.id } });
      if (items.length) {
        await prisma.extractedNewsItem.createMany({
          data: items.map((item) => ({
            sourceId: source.id,
            extractionRunId: run.id,
            title: item.title || "(empty title)",
            url: item.url || "",
            normalizedUrl: item.normalizedUrl || "",
            publishedAt: item.publishedAt || null,
            rawDate: item.rawDate,
            position: item.position,
            extractedAt: item.extractedAt,
          })),
        });
      }

      run = await prisma.extractionRun.update({
        where: { id: run.id },
        data: {
          finishedAt: new Date(),
          status,
          httpStatus: fetched.httpStatus,
          responseTimeMs: fetched.responseTimeMs,
          itemsFound: items.length,
          itemsWithTitle,
          itemsWithUrl,
          itemsWithDate,
          evidenceJson: JSON.stringify(evidence),
          errorMessage: evidence.errorMessage,
        },
        include: {
          extractedItems: true,
        },
      });

      await prisma.newsSource.update({
        where: { id: source.id },
        data: {
          lastExtractionStatus: status,
          lastExtractedAt: new Date(),
        },
      });
    }

    return {
      persisted: options.persist !== false,
      run,
      status,
      items,
      evidence,
    };
  } catch (error) {
    const evidence = {
      pageUrl,
      selectors,
      itemsFound: 0,
      errorMessage: error.message,
    };

    if (options.persist !== false && run) {
      run = await prisma.extractionRun.update({
        where: { id: run.id },
        data: {
          finishedAt: new Date(),
          status: "ERROR",
          errorMessage: error.message,
          evidenceJson: JSON.stringify(evidence),
        },
      });

      await prisma.newsSource.update({
        where: { id: source.id },
        data: {
          lastExtractionStatus: "ERROR",
          lastExtractedAt: new Date(),
        },
      });
    }

    return {
      persisted: options.persist !== false,
      run,
      status: "ERROR",
      items: [],
      evidence,
    };
  }
}

async function runExtractionBySourceId(sourceId, options = {}) {
  const source = await prisma.newsSource.findUnique({ where: { id: Number(sourceId) } });
  if (!source) {
    const error = new Error("Source not found.");
    error.status = 404;
    throw error;
  }

  return executeExtraction(source, options);
}

module.exports = {
  executeExtraction,
  runExtractionBySourceId,
};
