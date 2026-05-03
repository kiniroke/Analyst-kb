const cheerio = require("cheerio");
const { parseDateValue } = require("../utils/dateParser");

function validateSelectors(html, selectors = {}) {
  const $ = cheerio.load(html || "");
  const containers = selectors.containerSelector ? $(selectors.containerSelector) : null;
  let items = [];

  if (containers?.length) {
    items = containers
      .slice(0, 20)
      .map((index, element) => {
        const node = $(element);
        const titleNode = selectors.titleSelector ? node.find(selectors.titleSelector).first() : node.find("a").first();
        const linkNode = selectors.linkSelector ? node.find(selectors.linkSelector).first() : titleNode;
        const dateNode = selectors.dateSelector ? node.find(selectors.dateSelector).first() : null;
        const title = titleNode.text().trim();
        const href = linkNode.attr("href") || titleNode.attr("href") || "";
        const rawDate = dateNode?.attr("datetime") || dateNode?.text().trim() || "";
        return {
          title,
          href,
          rawDate,
          parsedDate: parseDateValue(rawDate),
        };
      })
      .get();
  }

  const itemsWithTitle = items.filter((item) => item.title).length;
  const itemsWithUrl = items.filter((item) => item.href).length;
  const itemsWithDate = items.filter((item) => item.parsedDate).length;

  return {
    containersFound: containers?.length || 0,
    itemsFound: items.length,
    itemsWithTitle,
    itemsWithUrl,
    itemsWithDate,
    sampleItems: items.slice(0, 5),
  };
}

module.exports = {
  validateSelectors,
};
