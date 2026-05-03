const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const userSeeds = [
  {
    fullName: "System Administrator",
    email: "admin@csi.local",
    password: "Admin12345",
    role: "ADMIN",
    department: "Data Analytics Department",
  },
  {
    fullName: "Lead Coverage Analyst",
    email: "analyst@csi.local",
    password: "Analyst12345",
    role: "ANALYST",
    department: "Data Analytics Department",
  },
  {
    fullName: "Read Only Viewer",
    email: "viewer@csi.local",
    password: "Viewer12345",
    role: "VIEWER",
    department: "Data Analytics Department",
  },
];

const sourceSeeds = [
  ["zakon.kz", "http://zakon.kz", "http://zakon.kz", "NEWS_PORTAL", "REPUBLICAN", "National", "Russian", "marina", "ACTIVE", "h3 a, h2 a", "a", "time, .date", "article, .article-item", "Default source with editable selectors."],
  ["lada.kz", "https://www.lada.kz/", "https://www.lada.kz/", "REGIONAL_MEDIA", "REGIONAL", "Mangystau", "Russian", "zhanat", "ACTIVE", "h2 a, h3 a", "a", "time, .date", "article, .news-item", "Regional media source."],
  ["mangystaumedia.kz", "https://mangystaumedia.kz/kk", "https://mangystaumedia.kz/kk", "REGIONAL_MEDIA", "REGIONAL", "Mangystau", "Kazakh", "zhanat", "ACTIVE", "h2 a, h3 a", "a", "time, .date", "article, .item", "Kazakh language source."],
  ["inaktau.kz", "https://www.inaktau.kz/", "https://www.inaktau.kz/", "REGIONAL_MEDIA", "REGIONAL", "Mangystau", "Russian", "zhanat", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["mangystautv.kz", "https://mangystautv.kz/ru", "https://mangystautv.kz/ru", "TV", "REGIONAL", "Mangystau", "Russian", "zhanat", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["tumba.kz", "https://tumba.kz/zhizn-regiona.html", "https://tumba.kz/zhizn-regiona.html", "REGIONAL_MEDIA", "REGIONAL", "Mangystau", "Russian", "zhanat", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["tengrinews.kz", "https://tengrinews.kz/", "https://tengrinews.kz/", "NEWS_PORTAL", "REPUBLICAN", "National", "Russian", "bauyrzhan", "ACTIVE", "h1 a, h2 a, h3 a", "a", "time, .tn-timestamp", "article, .content_main_item, .tn-news-item", "Broad selectors for a large national source."],
  ["nur.kz", "https://www.nur.kz/", "https://www.nur.kz/", "NEWS_PORTAL", "REPUBLICAN", "National", "Russian", "aizada", "ACTIVE", "h2 a, h3 a", "a", "time, .formatted-body__date", "article, .newslist__item", "Default selectors."],
  ["inform.kz", "https://lenta.inform.kz/", "https://lenta.inform.kz/", "NEWS_PORTAL", "REPUBLICAN", "National", "Russian", "guldana", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["egemen.kz", "https://ru.egemen.kz/last-news", "https://ru.egemen.kz/last-news", "NEWS_PORTAL", "REPUBLICAN", "National", "Russian", "guldana", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["24.kz", "https://24.kz/ru/news", "https://24.kz/ru/news", "TV", "REPUBLICAN", "National", "Russian", "aizada", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["ratel.kz", "https://ratel.kz/news", "https://ratel.kz/news", "NEWS_PORTAL", "REPUBLICAN", "National", "Russian", "aizada", "NEEDS_REVIEW", "", "", "", "", "Selectors unknown."],
  ["today.kz", "http://today.kz", "http://today.kz", "NEWS_PORTAL", "REPUBLICAN", "National", "Russian", "aizada", "DISABLED", "", "", "", "", "Source currently unstable."],
  ["caravan.kz", "https://caravan.kz/news/", "https://caravan.kz/news/", "NEWS_PORTAL", "REPUBLICAN", "National", "Russian", "marina", "ACTIVE", "", "", "", "", "News page available."],
  ["time.kz", "https://time.kz/news", "https://time.kz/news", "NEWS_PORTAL", "REPUBLICAN", "National", "Russian", "marina", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["azattyq-ruhy.kz", "https://rus.azattyq-ruhy.kz/news", "https://rus.azattyq-ruhy.kz/news", "NEWS_PORTAL", "REPUBLICAN", "National", "Russian", "marina", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["matritca.kz", "http://www.matritca.kz/news/", "http://www.matritca.kz/news/", "NEWS_PORTAL", "REPUBLICAN", "National", "Russian", "marina", "NEEDS_REVIEW", "", "", "", "", "Needs selector review."],
  ["kaztag.kz", "https://kaztag.kz/ru/", "https://kaztag.kz/ru/", "NEWS_PORTAL", "REPUBLICAN", "National", "Russian", "marina", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["inbusiness.kz", "https://inbusiness.kz/ru/last", "https://inbusiness.kz/ru/last", "NEWS_PORTAL", "REPUBLICAN", "National", "Russian", "bakhyt", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["mail.kz", "https://mail.kz/ru/news/kz-news", "https://mail.kz/ru/news/kz-news", "NEWS_PORTAL", "REPUBLICAN", "National", "Russian", "bakhyt", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["almaty.tv", "https://almaty.tv/news?news_sort_id=1&news_category_name=&tag=&page=1", "https://almaty.tv/news?news_sort_id=1&news_category_name=&tag=&page=1", "TV", "REGIONAL", "Almaty", "Russian", "zaure", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["sputniknews.kz", "https://ru.sputniknews.kz/archive/", "https://ru.sputniknews.kz/archive/", "NEWS_PORTAL", "INTERNATIONAL", "National", "Russian", "aizada", "ACTIVE", "", "", "", "", "Archive-style page."],
  ["aqparat.info", "https://aqparat.info/search?text=", "https://aqparat.info/search?text=", "OTHER", "UNKNOWN", "National", "Russian", "aizada", "NEEDS_REVIEW", "", "", "", "", "Search page needs manual mapping."],
  ["caravan.kz_gazeta", "https://caravan.kz/gazeta/", "https://caravan.kz/gazeta/", "PAPER", "REPUBLICAN", "National", "Russian", "marina", "ACTIVE", "", "", "", "", "Newspaper section."],
  ["kursiv.kz", "http://kursiv.kz", "http://kursiv.kz", "NEWS_PORTAL", "REPUBLICAN", "National", "Russian", "bakhyt", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["total.kz", "https://total.kz", "https://total.kz", "NEWS_PORTAL", "REPUBLICAN", "National", "Russian", "bakhyt", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["aikyn.kz", "https://aikyn.kz", "https://aikyn.kz", "NEWS_PORTAL", "REPUBLICAN", "National", "Kazakh", "saule", "ACTIVE", "", "", "", "", "Kazakh language source."],
  ["informburo.kz", "https://informburo.kz", "https://informburo.kz", "NEWS_PORTAL", "REPUBLICAN", "National", "Russian", "bauyrzhan", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["khabar.kz", "https://khabar.kz/", "https://khabar.kz/", "TV", "REPUBLICAN", "National", "Russian", "bakhyt", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["holanews.kz", "https://holanews.kz/", "https://holanews.kz/", "NEWS_PORTAL", "REPUBLICAN", "National", "Russian", "aizada", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["kazpravda.kz", "https://kazpravda.kz/", "https://kazpravda.kz/", "NEWS_PORTAL", "REPUBLICAN", "National", "Russian", "guldana", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["avestnik.kz", "https://avestnik.kz/", "https://avestnik.kz/", "REGIONAL_MEDIA", "REGIONAL", "Aktobe", "Russian", "aizada", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["ktk.kz", "https://ktk.kz/", "https://ktk.kz/", "TV", "REPUBLICAN", "National", "Russian", "aizada", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["diapazon.kz", "https://diapazon.kz/", "https://diapazon.kz/", "REGIONAL_MEDIA", "REGIONAL", "Aktobe", "Russian", "aizada", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["aqtobegazeti.kz", "https://aqtobegazeti.kz/", "https://aqtobegazeti.kz/", "PAPER", "REGIONAL", "Aktobe", "Kazakh", "jami.imanova", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["pavlodarnews.kz", "http://pavlodarnews.kz/", "http://pavlodarnews.kz/", "REGIONAL_MEDIA", "REGIONAL", "Pavlodar", "Russian", "saken", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["pavlodartv.kz", "http://pavlodartv.kz/", "http://pavlodartv.kz/", "TV", "REGIONAL", "Pavlodar", "Russian", "saken", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["pavon.kz", "http://pavon.kz/", "http://pavon.kz/", "REGIONAL_MEDIA", "REGIONAL", "Pavlodar", "Russian", "saken", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["gorodpavlodar.kz", "http://gorodpavlodar.kz/", "http://gorodpavlodar.kz/", "REGIONAL_MEDIA", "REGIONAL", "Pavlodar", "Russian", "saken", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["pavlodar.city", "https://pavlodar.city/", "https://pavlodar.city/", "REGIONAL_MEDIA", "REGIONAL", "Pavlodar", "Russian", "saken", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["obozrenie.kz", "https://obozrenie.kz/", "https://obozrenie.kz/", "REGIONAL_MEDIA", "REGIONAL", "Pavlodar", "Russian", "saken", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["pavlodar.gov.kz", "https://www.gov.kz/memleket/entities/pavlodar/press/news/1?lang=ru", "https://www.gov.kz/memleket/entities/pavlodar/press/news/1?lang=ru", "GOVERNMENT", "REGIONAL", "Pavlodar", "Russian", "saken", "ACTIVE", "", "", "", "", "Government source."],
  ["inatyrau.kz", "https://www.inatyrau.kz", "https://www.inatyrau.kz", "REGIONAL_MEDIA", "REGIONAL", "Atyrau", "Russian", "bakhyt", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["atyrautv.kz", "https://www.atyrautv.kz", "https://www.atyrautv.kz", "TV", "REGIONAL", "Atyrau", "Russian", "bakhyt", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["atyrau.gov.kz", "https://www.atyrau.gov.kz", "https://www.atyrau.gov.kz", "GOVERNMENT", "REGIONAL", "Atyrau", "Russian", "bakhyt", "ACTIVE", "", "", "", "", "Government source."],
  ["azh.kz", "https://azh.kz/", "https://azh.kz/", "REGIONAL_MEDIA", "REGIONAL", "Atyrau", "Russian", "bakhyt", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["caspianlife.kz", "https://caspianlife.kz/", "https://caspianlife.kz/", "REGIONAL_MEDIA", "REGIONAL", "Atyrau", "Russian", "bakhyt", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["vlast.kz", "https://vlast.kz/", "https://vlast.kz/", "NEWS_PORTAL", "REPUBLICAN", "National", "Russian", "marina", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["newtimes.kz", "https://newtimes.kz/", "https://newtimes.kz/", "NEWS_PORTAL", "REPUBLICAN", "National", "Russian", "marina", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["zhalobi.kz", "https://zhalobi.kz/", "https://zhalobi.kz/", "OTHER", "UNKNOWN", "National", "Russian", "nurzhan", "NEEDS_REVIEW", "", "", "", "", "Complaint platform."],
  ["baigenews.kz", "https://baigenews.kz/", "https://baigenews.kz/", "NEWS_PORTAL", "REPUBLICAN", "National", "Russian", "bauyrzhan", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["apgazeta.kz", "https://apgazeta.kz/", "https://apgazeta.kz/", "PAPER", "REGIONAL", "Akmola", "Russian", "user03", "ACTIVE", "", "", "", "", "Regional newspaper."],
  ["aqmolanews.kz", "https://aqmolanews.kz/", "https://aqmolanews.kz/", "REGIONAL_MEDIA", "REGIONAL", "Akmola", "Russian", "user03", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["arka-azhary.kz", "https://arka-azhary.kz.kz/", "https://arka-azhary.kz.kz/", "PAPER", "REGIONAL", "Akmola", "Kazakh", "user03", "NEEDS_REVIEW", "", "", "", "", "Suspicious URL requires verification."],
  ["kokshetau-gorpol.kz", "http://kokshetau-gorpol.kz/", "http://kokshetau-gorpol.kz/", "GOVERNMENT", "REGIONAL", "Akmola", "Russian", "user03", "ACTIVE", "", "", "", "", "Government source."],
  ["kokshetoday.kz", "https://kokshetoday.kz/", "https://kokshetoday.kz/", "REGIONAL_MEDIA", "REGIONAL", "Akmola", "Russian", "user03", "ACTIVE", "", "", "", "", "Needs selector review."],
  ["dialog.egov.kz", "https://dialog.egov.kz/", "https://dialog.egov.kz/", "GOVERNMENT", "REPUBLICAN", "National", "Russian", "user03", "ACTIVE", "", "", "", "", "Government dialogue platform."],
];

const knowledgeArticleSeeds = [
  ["How to configure selectors for a news source", "SELECTORS", "Configure container, title, link and date selectors for a source page.", "Use browser inspection tools to identify repeated news blocks, then set the smallest stable container selector. Inside the container, add title, link and date selectors and test them in Extraction Lab. Save selectors only after sample items contain valid title and URL values.", ["Open the source page in a browser.", "Inspect the repeating news block.", "Set containerSelector to the repeating block.", "Set titleSelector, linkSelector and dateSelector inside the block.", "Run Extraction Lab and review the first 20 items.", "Save selectors if the result is stable."], "Example evidence: screenshot of repeated article card HTML. Recommended action: save selectors only after validation."],
  ["How to test extraction from a news list page", "SOURCE_EXTRACTION", "Run an extraction test and review item counts, missing fields and warnings.", "Extraction tests call the website from backend, parse HTML with cheerio and save a run. Analysts should review response code, response time, item counts and sample results before using the extraction run for coverage validation.", ["Select a source in Extraction Lab.", "Review the current selectors.", "Run extraction test.", "Check items found, items with title, items with URL and items with date.", "Open sample extracted items and confirm they are real news entries."], "Example evidence: extraction run summary with sample items. Recommended action: fix selectors if dates or URLs are missing."],
  ["How fallback extraction works", "SOURCE_EXTRACTION", "Fallback extraction scans article-like links when selectors are missing or weak.", "If containerSelector is empty or produces no items, the backend falls back to anchor-based extraction. It keeps only links with non-empty text that look like article URLs and removes obvious navigation and footer links.", ["Leave selectors empty or run a failing extraction.", "Observe whether fallback links were collected.", "Review whether items look like article links instead of menus.", "Use fallback only as a diagnostic result.", "Add stable selectors after validation."], "Example evidence: fallback mode flag inside evidence JSON. Recommended action: replace fallback with explicit selectors."],
  ["How to read extraction errors", "TROUBLESHOOTING", "Use exact backend evidence to understand request or selector failures.", "Extraction errors are not faked. The system stores exact backend failure details including timeout, blocked request, invalid URL or selector failure. Analysts should copy the evidence and create an issue when a source repeatedly returns ERROR.", ["Open the extraction run details.", "Read httpStatus, errorMessage and responseTimeMs.", "Check whether zero items were found.", "Review selectors used in evidence.", "Create a DataIssue if the failure repeats."], "Example evidence: timeout or HTTP 403 message. Recommended action: re-test later or review network restrictions."],
  ["How to prepare CSI export from mm.csi.kz/socmedia", "CSI_EXPORT", "Download a clean export file for the same source and period used in the website check.", "The platform cannot validate CSI coverage without actual CSI data. Analysts should export the relevant data from mm.csi.kz/socmedia with title, URL, date, source and region fields when possible.", ["Filter the source and period in CSI.", "Export to CSV or Excel.", "Check that title, URL and date columns exist.", "Upload the file into the CSI Data Import page."], "Example evidence: exported CSV file name and period. Recommended action: align export period with extraction date."],
  ["How to import CSI export into Parser Coverage Validator", "CSI_EXPORT", "Preview mapped columns before confirming import.", "The import tool maps common CSI column names automatically. Analysts should check preview rows and column mapping before confirm import to avoid wrong source or date matching.", ["Open CSI Data Import.", "Choose Export mode.", "Upload CSV or XLSX.", "Review auto-mapped fields in preview.", "Confirm import and note the created batch ID."], "Example evidence: preview rows in CSI Data Import. Recommended action: re-upload if title or URL fields are empty."],
  ["How URL-based matching works", "DATA_MATCHING", "URL equality is the strongest match condition.", "Coverage matching first normalizes absolute URLs and compares them directly. If normalized URLs are equal, the item is marked as MATCHED even if the title text differs slightly.", ["Run a coverage check.", "Open results and review URL matches.", "Compare normalized source and CSI URLs in evidence.", "Treat URL matches as the most reliable signal."], "Example evidence: normalizedUrl equality. Recommended action: review title mismatch only if URL matches but titles differ strongly."],
  ["How title similarity matching works", "DATA_MATCHING", "Title similarity supports coverage checks when URL fields differ.", "When exact URL match is not available, the platform compares normalized titles and uses a similarity score. High similarity can produce MATCHED or LOW_CONFIDENCE results depending on the score threshold.", ["Review title normalization output.", "Compare title similarity score in match results.", "Treat >= 0.85 as high confidence.", "Treat 0.70 to 0.84 as low confidence and verify manually."], "Example evidence: similarity score in match result. Recommended action: use manual verification for low-confidence results."],
  ["How to interpret low confidence matches", "COVERAGE_VALIDATION", "Low-confidence matches should be reviewed manually before closing issues.", "LOW_CONFIDENCE means the record may correspond to the same article but evidence is weaker than exact URL match or strong title similarity. Analysts should inspect both items before using the result in reporting.", ["Open the low-confidence row.", "Compare extracted and CSI titles.", "Compare URLs and dates.", "Decide whether manual issue creation is required."], "Example evidence: score between 0.70 and 0.84. Recommended action: verify manually."],
  ["How to handle missing news in CSI", "COVERAGE_VALIDATION", "Missing items indicate potential parser schedule or source mapping problems.", "If extracted source news is not found in CSI records for the same period, the platform marks it as MISSING_IN_CSI and can create a DataIssue automatically.", ["Run coverage check with valid CSI batch.", "Filter results by MISSING_IN_CSI.", "Review extracted title, URL and publishedAt.", "Create issues from selected missing rows.", "Assign the issue to the responsible analyst or IT contact."], "Example evidence: extracted source item without matched CSI record. Recommended action: check parser schedule and source mapping."],
  ["How to handle duplicate news in CSI", "COVERAGE_VALIDATION", "Duplicate CSI records indicate deduplication problems.", "If one extracted item matches multiple CSI records, the system marks duplicates and recommends reviewing unique key logic based on URL or title.", ["Open duplicate results.", "Compare matching CSI record IDs.", "Check whether URLs or titles are duplicated.", "Create issue and assign it for parser QA."], "Example evidence: multiple CSI records linked to one extracted item. Recommended action: inspect deduplication rules."],
  ["How to handle title mismatch", "COVERAGE_VALIDATION", "Title mismatch usually indicates extraction cleaning or truncation problems.", "URL may match while title text differs strongly. This often points to title selector issues, extra whitespace, site-side prefixes or CSI-side text cleaning differences.", ["Review source title and CSI title side by side.", "Check title normalization output.", "Inspect source HTML title block.", "Update selectors or text cleaning expectations if needed."], "Example evidence: URL matched but titles differ. Recommended action: check title extraction logic."],
  ["How to handle date mismatch", "COVERAGE_VALIDATION", "Date mismatch usually indicates parsing format or timezone problems.", "DATE_MISMATCH appears when the extracted and CSI publication dates differ significantly. Analysts should confirm whether the source page uses local timezone, relative dates or delayed publication timestamps.", ["Open the result row.", "Compare rawDate and parsed publishedAt fields.", "Check source timezone or relative date labels.", "Create issue if the mismatch is systemic."], "Example evidence: same article with different publication date. Recommended action: review date normalization and timezone handling."],
  ["When CSI API credentials are required", "CSI_API", "API mode requires analyst-provided endpoint and token or cookie.", "The platform never fakes CSI API success. If token, cookie or endpoint is missing or invalid, the system records the exact backend error and does not claim coverage validation is complete.", ["Open CSI Data Import.", "Choose API mode.", "Provide endpoint, method and token or cookie.", "Run API load and review the exact response."], "Example evidence: HTTP 401 or missing credential error. Recommended action: request valid CSI API access."],
  ["How to create issue from coverage check", "COVERAGE_VALIDATION", "Use automatic or manual issue creation after reviewing coverage problems.", "Coverage rows can be converted to DataIssue records for parser QA workflow. This keeps evidence and recommendation linked to the source and coverage check.", ["Open a coverage check.", "Filter problematic rows.", "Create issues from coverage.", "Assign severity and analyst if needed.", "Track status in Issues page."], "Example evidence: coverage row JSON. Recommended action: create issues for repeated missing or duplicate cases."],
  ["How to create task from issue", "REPORTING", "Tasks turn QA issues into trackable work items.", "After issue creation, analysts can create a linked task, assign it, set a due date and move it through the Kanban board.", ["Open the issue record.", "Click create task.", "Set title, priority and due date.", "Assign responsible analyst.", "Track the task in Tasks page until DONE."], "Example evidence: linked issue and task IDs. Recommended action: use tasks for follow-up and recheck work."],
];

function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "");
  } catch (error) {
    return url?.trim() || "";
  }
}

async function main() {
  await prisma.coverageMatchResult.deleteMany();
  await prisma.task.deleteMany();
  await prisma.dataIssue.deleteMany();
  await prisma.coverageCheck.deleteMany();
  await prisma.csiRecord.deleteMany();
  await prisma.csiDataBatch.deleteMany();
  await prisma.extractedNewsItem.deleteMany();
  await prisma.extractionRun.deleteMany();
  await prisma.knowledgeArticle.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.newsSource.deleteMany();
  await prisma.user.deleteMany();

  // Keep seeded demo IDs stable across repeated reseeds in SQLite.
  await prisma.$executeRawUnsafe(`DELETE FROM sqlite_sequence`);

  const users = {};
  for (const seed of userSeeds) {
    const passwordHash = await bcrypt.hash(seed.password, 10);
    const user = await prisma.user.create({
      data: {
        fullName: seed.fullName,
        email: seed.email,
        passwordHash,
        role: seed.role,
        department: seed.department,
      },
    });
    users[seed.role] = user;
  }

  const sources = {};
  for (const seed of sourceSeeds) {
    const source = await prisma.newsSource.create({
      data: {
        name: seed[0],
        baseUrl: seed[1],
        newsListUrl: seed[2],
        normalizedUrl: normalizeUrl(seed[2] || seed[1]),
        sourceType: seed[3],
        aggregationLevel: seed[4],
        region: seed[5],
        language: seed[6],
        watcher: seed[7],
        status: seed[8],
        titleSelector: seed[9],
        linkSelector: seed[10],
        dateSelector: seed[11],
        containerSelector: seed[12],
        lastExtractionStatus: "NOT_TESTED",
        notes: seed[13],
      },
    });
    sources[source.name] = source;
  }

  for (const article of knowledgeArticleSeeds) {
    await prisma.knowledgeArticle.create({
      data: {
        title: article[0],
        category: article[1],
        summary: article[2],
        content: `${article[3]}\n\n${article[5]}`,
        steps: JSON.stringify(article[4]),
        createdById: users.ADMIN.id,
      },
    });
  }

  const zakonRun = await prisma.extractionRun.create({
    data: {
      sourceId: sources["zakon.kz"].id,
      startedAt: new Date("2026-05-03T08:00:00.000Z"),
      finishedAt: new Date("2026-05-03T08:00:02.000Z"),
      status: "OK",
      pageUrl: sources["zakon.kz"].newsListUrl,
      httpStatus: 200,
      responseTimeMs: 842,
      itemsFound: 6,
      itemsWithTitle: 6,
      itemsWithUrl: 6,
      itemsWithDate: 5,
      evidenceJson: JSON.stringify({
        pageUrl: sources["zakon.kz"].newsListUrl,
        selectors: {
          containerSelector: "article, .article-item",
          titleSelector: "h3 a, h2 a",
          linkSelector: "a",
          dateSelector: "time, .date",
        },
        itemsFound: 6,
        sampleItems: [
          { title: "Government approves regional transport update", url: "http://zakon.kz/news/transport-update-1" },
          { title: "Akimat publishes emergency response memo", url: "http://zakon.kz/news/emergency-memo-2" },
        ],
      }),
      createdById: users.ANALYST.id,
      createdAt: new Date("2026-05-03T08:00:02.000Z"),
    },
  });

  const zakonItems = await Promise.all(
    [
      ["Government approves regional transport update", "http://zakon.kz/news/transport-update-1", "2026-05-02T06:00:00.000Z", "02.05.2026 11:00"],
      ["Akimat publishes emergency response memo", "http://zakon.kz/news/emergency-memo-2", "2026-05-02T07:00:00.000Z", "02.05.2026 12:00"],
      ["Health ministry clarifies vaccination schedule", "http://zakon.kz/news/health-schedule-3", "2026-05-02T08:00:00.000Z", "02.05.2026 13:00"],
      ["Regional school funding round starts", "http://zakon.kz/news/school-funding-4", "2026-05-02T09:00:00.000Z", "02.05.2026 14:00"],
      ["Water supply repair map updated", "http://zakon.kz/news/water-repair-5", "2026-05-02T10:00:00.000Z", "02.05.2026 15:00"],
      ["Aviation route briefing released", "http://zakon.kz/news/aviation-briefing-6", null, ""],
    ].map((item, index) =>
      prisma.extractedNewsItem.create({
        data: {
          sourceId: sources["zakon.kz"].id,
          extractionRunId: zakonRun.id,
          title: item[0],
          url: item[1],
          normalizedUrl: normalizeUrl(item[1]),
          publishedAt: item[2] ? new Date(item[2]) : null,
          rawDate: item[3] || null,
          position: index + 1,
          extractedAt: new Date("2026-05-03T08:00:02.000Z"),
        },
      })
    )
  );

  await prisma.newsSource.update({
    where: { id: sources["zakon.kz"].id },
    data: {
      lastExtractionStatus: "OK",
      lastExtractedAt: new Date("2026-05-03T08:00:02.000Z"),
    },
  });

  const ladaRun = await prisma.extractionRun.create({
    data: {
      sourceId: sources["lada.kz"].id,
      startedAt: new Date("2026-05-03T09:00:00.000Z"),
      finishedAt: new Date("2026-05-03T09:00:03.000Z"),
      status: "WARNING",
      pageUrl: sources["lada.kz"].newsListUrl,
      httpStatus: 200,
      responseTimeMs: 1140,
      itemsFound: 4,
      itemsWithTitle: 4,
      itemsWithUrl: 4,
      itemsWithDate: 1,
      errorMessage: "Items extracted, but date coverage is incomplete.",
      evidenceJson: JSON.stringify({
        pageUrl: sources["lada.kz"].newsListUrl,
        fallbackUsed: true,
        warning: "Low item count and missing dates.",
      }),
      createdById: users.ANALYST.id,
      createdAt: new Date("2026-05-03T09:00:03.000Z"),
    },
  });

  await prisma.newsSource.update({
    where: { id: sources["lada.kz"].id },
    data: {
      lastExtractionStatus: "WARNING",
      lastExtractedAt: new Date("2026-05-03T09:00:03.000Z"),
    },
  });

  const demoBatch = await prisma.csiDataBatch.create({
    data: {
      mode: "EXPORT",
      fileName: "demo_csi_export.csv",
      periodFrom: new Date("2026-05-01T00:00:00.000Z"),
      periodTo: new Date("2026-05-03T23:59:59.000Z"),
      totalRows: 7,
      successfulRows: 7,
      failedRows: 0,
      sourceLabel: "Demo CSI export data",
      notes: "Local demo batch with matched, duplicate, mismatch and extra rows.",
      uploadedById: users.ADMIN.id,
    },
  });

  const csiRecords = await Promise.all(
    [
      ["zakon.kz", "Government approves regional transport update", "http://zakon.kz/news/transport-update-1", "2026-05-02T06:00:00.000Z", "Reporter Desk", "SMI", "neutral", "National"],
      ["zakon.kz", "Akimat publishes emergency response memo", "http://zakon.kz/news/emergency-memo-2", "2026-05-02T07:00:00.000Z", "Reporter Desk", "SMI", "neutral", "National"],
      ["zakon.kz", "Akimat publishes emergency response memo", "http://zakon.kz/news/emergency-memo-2", "2026-05-02T07:00:00.000Z", "Reporter Desk", "SMI", "neutral", "National"],
      ["zakon.kz", "Health ministry schedule updated for vaccination", "http://zakon.kz/news/health-schedule-3", "2026-05-02T09:30:00.000Z", "Health Beat", "SMI", "neutral", "National"],
      ["zakon.kz", "Water supply repair map updated", "http://zakon.kz/news/water-repair-5", "2026-05-01T10:00:00.000Z", "City Desk", "SMI", "neutral", "National"],
      ["zakon.kz", "Unrelated CSI-only item", "http://zakon.kz/news/csi-extra-7", "2026-05-02T11:00:00.000Z", "Desk", "SMI", "neutral", "National"],
      ["lada.kz", "Regional port schedule revised", "https://www.lada.kz/aktau-news/port-schedule", "2026-05-02T12:00:00.000Z", "Regional Desk", "SMI", "neutral", "Mangystau"],
    ].map((record) =>
      prisma.csiRecord.create({
        data: {
          batchId: demoBatch.id,
          sourceName: record[0],
          title: record[1],
          url: record[2],
          normalizedUrl: normalizeUrl(record[2]),
          publishedAt: new Date(record[3]),
          rawDate: record[3],
          author: record[4],
          platform: record[5],
          tone: record[6],
          region: record[7],
          importedAt: new Date("2026-05-03T08:20:00.000Z"),
        },
      })
    )
  );

  const coverageCheck = await prisma.coverageCheck.create({
    data: {
      sourceId: sources["zakon.kz"].id,
      extractionRunId: zakonRun.id,
      csiBatchId: demoBatch.id,
      checkedAt: new Date("2026-05-03T08:30:00.000Z"),
      periodFrom: new Date("2026-05-01T00:00:00.000Z"),
      periodTo: new Date("2026-05-03T23:59:59.000Z"),
      status: "PARTIAL",
      sourceItemsCount: 6,
      csiItemsCount: 6,
      matchedCount: 2,
      missingCount: 2,
      duplicateCount: 1,
      mismatchCount: 2,
      coveragePercent: 33.33,
      summary: "Demo coverage check with matched, missing, duplicate and mismatch examples.",
      createdById: users.ANALYST.id,
      createdAt: new Date("2026-05-03T08:30:01.000Z"),
    },
  });

  await prisma.coverageMatchResult.createMany({
    data: [
      {
        coverageCheckId: coverageCheck.id,
        extractedNewsId: zakonItems[0].id,
        csiRecordId: csiRecords[0].id,
        matchStatus: "MATCHED",
        matchScore: 1,
        evidence: JSON.stringify({ reason: "Exact normalized URL match." }),
      },
      {
        coverageCheckId: coverageCheck.id,
        extractedNewsId: zakonItems[1].id,
        csiRecordId: csiRecords[1].id,
        matchStatus: "DUPLICATE_IN_CSI",
        matchScore: 1,
        evidence: JSON.stringify({ reason: "Two CSI records share the same normalized URL.", duplicateRecordIds: [csiRecords[1].id, csiRecords[2].id] }),
      },
      {
        coverageCheckId: coverageCheck.id,
        extractedNewsId: zakonItems[2].id,
        csiRecordId: csiRecords[3].id,
        matchStatus: "TITLE_MISMATCH",
        matchScore: 0.79,
        evidence: JSON.stringify({ reason: "URL differs, titles are similar but not exact." }),
      },
      {
        coverageCheckId: coverageCheck.id,
        extractedNewsId: zakonItems[3].id,
        csiRecordId: null,
        matchStatus: "MISSING_IN_CSI",
        matchScore: 0,
        evidence: JSON.stringify({ reason: "No CSI record found for extracted item." }),
      },
      {
        coverageCheckId: coverageCheck.id,
        extractedNewsId: zakonItems[4].id,
        csiRecordId: csiRecords[4].id,
        matchStatus: "DATE_MISMATCH",
        matchScore: 0.92,
        evidence: JSON.stringify({ reason: "URL/title match but publication dates differ by more than 12 hours." }),
      },
      {
        coverageCheckId: coverageCheck.id,
        extractedNewsId: zakonItems[5].id,
        csiRecordId: null,
        matchStatus: "MISSING_IN_CSI",
        matchScore: 0,
        evidence: JSON.stringify({ reason: "No CSI record found for extracted item." }),
      },
      {
        coverageCheckId: coverageCheck.id,
        extractedNewsId: null,
        csiRecordId: csiRecords[5].id,
        matchStatus: "EXTRA_IN_CSI",
        matchScore: 0,
        evidence: JSON.stringify({ reason: "CSI record exists without matching extracted source item." }),
      },
    ],
  });

  const issueMissing = await prisma.dataIssue.create({
    data: {
      sourceId: sources["zakon.kz"].id,
      coverageCheckId: coverageCheck.id,
      entityId: String(zakonItems[3].id),
      title: "Missing news in CSI for zakon.kz school funding item",
      issueType: "MISSING_IN_CSI",
      severity: "HIGH",
      status: "NEW",
      evidence: JSON.stringify({
        extractedTitle: zakonItems[3].title,
        extractedUrl: zakonItems[3].url,
        coverageCheckId: coverageCheck.id,
      }),
      recommendation: "Check parser schedule, selectors and source mapping for this website.",
      createdById: users.ANALYST.id,
      assignedToId: users.ADMIN.id,
      createdAt: new Date("2026-05-03T08:35:00.000Z"),
    },
  });

  const issueDuplicate = await prisma.dataIssue.create({
    data: {
      sourceId: sources["zakon.kz"].id,
      coverageCheckId: coverageCheck.id,
      entityId: String(zakonItems[1].id),
      title: "Duplicate CSI records detected for emergency memo article",
      issueType: "DUPLICATE_IN_CSI",
      severity: "MEDIUM",
      status: "IN_PROGRESS",
      evidence: JSON.stringify({
        extractedTitle: zakonItems[1].title,
        duplicateRecordIds: [csiRecords[1].id, csiRecords[2].id],
      }),
      recommendation: "Check deduplication logic and unique key based on URL/title.",
      createdById: users.ANALYST.id,
      assignedToId: users.ADMIN.id,
      createdAt: new Date("2026-05-03T08:36:00.000Z"),
    },
  });

  await prisma.task.createMany({
    data: [
      {
        title: "Investigate missing zakon.kz article in CSI",
        description: "Recheck source mapping and scheduler window for the school funding item.",
        status: "TODO",
        priority: "HIGH",
        dueDate: new Date("2026-05-05T10:00:00.000Z"),
        assignedToId: users.ADMIN.id,
        createdById: users.ANALYST.id,
        relatedIssueId: issueMissing.id,
      },
      {
        title: "Review duplicate CSI key for emergency memo",
        description: "Validate URL-based uniqueness against imported CSI export rows.",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        dueDate: new Date("2026-05-06T10:00:00.000Z"),
        assignedToId: users.ANALYST.id,
        createdById: users.ADMIN.id,
        relatedIssueId: issueDuplicate.id,
      },
    ],
  });

  const tengriRun = await prisma.extractionRun.create({
    data: {
      sourceId: sources["tengrinews.kz"].id,
      startedAt: new Date("2026-05-03T10:10:00.000Z"),
      finishedAt: new Date("2026-05-03T10:10:04.000Z"),
      status: "OK",
      pageUrl: sources["tengrinews.kz"].newsListUrl,
      httpStatus: 200,
      responseTimeMs: 928,
      itemsFound: 5,
      itemsWithTitle: 5,
      itemsWithUrl: 5,
      itemsWithDate: 5,
      evidenceJson: JSON.stringify({
        pageUrl: sources["tengrinews.kz"].newsListUrl,
        itemsFound: 5,
        selectors: {
          containerSelector: sources["tengrinews.kz"].containerSelector,
          titleSelector: sources["tengrinews.kz"].titleSelector,
          linkSelector: sources["tengrinews.kz"].linkSelector,
          dateSelector: sources["tengrinews.kz"].dateSelector,
        },
      }),
      createdById: users.ANALYST.id,
      createdAt: new Date("2026-05-03T10:10:04.000Z"),
    },
  });

  const tengriItems = await Promise.all(
    [
      ["Cabinet reviews transport corridor update", "https://tengrinews.kz/kazakhstan_news/transport-corridor-update-1", "2026-05-03T05:00:00.000Z"],
      ["Regional flood response plan approved", "https://tengrinews.kz/kazakhstan_news/flood-response-plan-2", "2026-05-03T05:30:00.000Z"],
      ["Education ministry expands grant program", "https://tengrinews.kz/kazakhstan_news/grant-program-3", "2026-05-03T06:00:00.000Z"],
      ["Digital services center opens in Aktobe", "https://tengrinews.kz/kazakhstan_news/digital-services-4", "2026-05-03T06:30:00.000Z"],
      ["Emergency hotline schedule updated", "https://tengrinews.kz/kazakhstan_news/hotline-schedule-5", "2026-05-03T07:00:00.000Z"],
    ].map((item, index) =>
      prisma.extractedNewsItem.create({
        data: {
          sourceId: sources["tengrinews.kz"].id,
          extractionRunId: tengriRun.id,
          title: item[0],
          url: item[1],
          normalizedUrl: normalizeUrl(item[1]),
          publishedAt: new Date(item[2]),
          rawDate: item[2],
          position: index + 1,
          extractedAt: new Date("2026-05-03T10:10:04.000Z"),
        },
      })
    )
  );

  await prisma.newsSource.update({
    where: { id: sources["tengrinews.kz"].id },
    data: {
      lastExtractionStatus: "OK",
      lastExtractedAt: new Date("2026-05-03T10:10:04.000Z"),
    },
  });

  const inaktauRun = await prisma.extractionRun.create({
    data: {
      sourceId: sources["inaktau.kz"].id,
      startedAt: new Date("2026-05-03T10:40:00.000Z"),
      finishedAt: new Date("2026-05-03T10:40:02.000Z"),
      status: "ERROR",
      pageUrl: sources["inaktau.kz"].newsListUrl,
      httpStatus: 403,
      responseTimeMs: 601,
      itemsFound: 0,
      itemsWithTitle: 0,
      itemsWithUrl: 0,
      itemsWithDate: 0,
      errorMessage: "HTTP 403 returned by source website during extraction.",
      evidenceJson: JSON.stringify({
        pageUrl: sources["inaktau.kz"].newsListUrl,
        httpStatus: 403,
        errorMessage: "HTTP 403 returned by source website during extraction.",
      }),
      createdById: users.ANALYST.id,
      createdAt: new Date("2026-05-03T10:40:02.000Z"),
    },
  });

  await prisma.newsSource.update({
    where: { id: sources["inaktau.kz"].id },
    data: {
      lastExtractionStatus: "ERROR",
      lastExtractedAt: new Date("2026-05-03T10:40:02.000Z"),
      status: "NEEDS_REVIEW",
    },
  });

  const informburoRun = await prisma.extractionRun.create({
    data: {
      sourceId: sources["informburo.kz"].id,
      startedAt: new Date("2026-05-03T11:10:00.000Z"),
      finishedAt: new Date("2026-05-03T11:10:03.000Z"),
      status: "WARNING",
      pageUrl: sources["informburo.kz"].newsListUrl,
      httpStatus: 200,
      responseTimeMs: 1015,
      itemsFound: 7,
      itemsWithTitle: 7,
      itemsWithUrl: 7,
      itemsWithDate: 3,
      errorMessage: "Dates were extracted only for part of the page.",
      evidenceJson: JSON.stringify({
        pageUrl: sources["informburo.kz"].newsListUrl,
        warning: "Partial date extraction.",
      }),
      createdById: users.ADMIN.id,
      createdAt: new Date("2026-05-03T11:10:03.000Z"),
    },
  });

  await prisma.newsSource.update({
    where: { id: sources["informburo.kz"].id },
    data: {
      lastExtractionStatus: "WARNING",
      lastExtractedAt: new Date("2026-05-03T11:10:03.000Z"),
    },
  });

  const pavlodarRun = await prisma.extractionRun.create({
    data: {
      sourceId: sources["pavlodarnews.kz"].id,
      startedAt: new Date("2026-05-03T11:35:00.000Z"),
      finishedAt: new Date("2026-05-03T11:35:10.000Z"),
      status: "ERROR",
      pageUrl: sources["pavlodarnews.kz"].newsListUrl,
      httpStatus: null,
      responseTimeMs: 10000,
      itemsFound: 0,
      itemsWithTitle: 0,
      itemsWithUrl: 0,
      itemsWithDate: 0,
      errorMessage: "Request timeout after 10000 ms.",
      evidenceJson: JSON.stringify({
        pageUrl: sources["pavlodarnews.kz"].newsListUrl,
        errorMessage: "Request timeout after 10000 ms.",
      }),
      createdById: users.ADMIN.id,
      createdAt: new Date("2026-05-03T11:35:10.000Z"),
    },
  });

  await prisma.newsSource.update({
    where: { id: sources["pavlodarnews.kz"].id },
    data: {
      lastExtractionStatus: "ERROR",
      lastExtractedAt: new Date("2026-05-03T11:35:10.000Z"),
      status: "NEEDS_REVIEW",
    },
  });

  const manualBatch = await prisma.csiDataBatch.create({
    data: {
      mode: "MANUAL",
      fileName: "manual_tengri_demo.json",
      periodFrom: new Date("2026-05-03T00:00:00.000Z"),
      periodTo: new Date("2026-05-03T23:59:59.000Z"),
      totalRows: 5,
      successfulRows: 5,
      failedRows: 0,
      sourceLabel: "Manual JSON input",
      notes: "Manual demo batch for Tengrinews coverage example.",
      uploadedById: users.ADMIN.id,
    },
  });

  const manualCsiRecords = await Promise.all(
    tengriItems.map((item) =>
      prisma.csiRecord.create({
        data: {
          batchId: manualBatch.id,
          sourceName: "tengrinews.kz",
          title: item.title,
          url: item.url,
          normalizedUrl: item.normalizedUrl,
          publishedAt: item.publishedAt,
          rawDate: item.rawDate,
          author: "Tengri Desk",
          platform: "SMI",
          tone: "neutral",
          region: "National",
          importedAt: new Date("2026-05-03T10:20:00.000Z"),
        },
      })
    )
  );

  const ladaItems = await Promise.all(
    [
      ["Aktau port night schedule revised", "https://www.lada.kz/aktau-news/port-schedule", "2026-05-02T12:00:00.000Z"],
      ["Mangystau road inspection starts", "https://www.lada.kz/aktau-news/road-inspection", null],
      ["Regional water outage alert issued", "https://www.lada.kz/aktau-news/water-outage-alert", null],
      ["School transport hotline published", "https://www.lada.kz/aktau-news/school-transport-hotline", null],
    ].map((item, index) =>
      prisma.extractedNewsItem.create({
        data: {
          sourceId: sources["lada.kz"].id,
          extractionRunId: ladaRun.id,
          title: item[0],
          url: item[1],
          normalizedUrl: normalizeUrl(item[1]),
          publishedAt: item[2] ? new Date(item[2]) : null,
          rawDate: item[2] || null,
          position: index + 1,
          extractedAt: new Date("2026-05-03T09:00:03.000Z"),
        },
      })
    )
  );

  const tengriCoverageCheck = await prisma.coverageCheck.create({
    data: {
      sourceId: sources["tengrinews.kz"].id,
      extractionRunId: tengriRun.id,
      csiBatchId: manualBatch.id,
      checkedAt: new Date("2026-05-03T10:25:00.000Z"),
      periodFrom: new Date("2026-05-03T00:00:00.000Z"),
      periodTo: new Date("2026-05-03T23:59:59.000Z"),
      status: "OK",
      sourceItemsCount: 5,
      csiItemsCount: 5,
      matchedCount: 5,
      missingCount: 0,
      duplicateCount: 0,
      mismatchCount: 0,
      coveragePercent: 100,
      summary: "All extracted Tengrinews items were found in the manual CSI demo batch.",
      createdById: users.ADMIN.id,
      createdAt: new Date("2026-05-03T10:25:01.000Z"),
    },
  });

  await prisma.coverageMatchResult.createMany({
    data: tengriItems.map((item, index) => ({
      coverageCheckId: tengriCoverageCheck.id,
      extractedNewsId: item.id,
      csiRecordId: manualCsiRecords[index].id,
      matchStatus: "MATCHED",
      matchScore: 1,
      evidence: JSON.stringify({ reason: "Exact normalized URL match." }),
    })),
  });

  const ladaCoverageCheck = await prisma.coverageCheck.create({
    data: {
      sourceId: sources["lada.kz"].id,
      extractionRunId: ladaRun.id,
      csiBatchId: demoBatch.id,
      checkedAt: new Date("2026-05-03T09:20:00.000Z"),
      periodFrom: new Date("2026-05-01T00:00:00.000Z"),
      periodTo: new Date("2026-05-03T23:59:59.000Z"),
      status: "FAILED",
      sourceItemsCount: 4,
      csiItemsCount: 1,
      matchedCount: 0,
      missingCount: 3,
      duplicateCount: 0,
      mismatchCount: 1,
      coveragePercent: 0,
      summary: "Lada demo coverage shows strong parser risk: most extracted items are missing in CSI.",
      createdById: users.ANALYST.id,
      createdAt: new Date("2026-05-03T09:20:01.000Z"),
    },
  });

  await prisma.coverageMatchResult.createMany({
    data: [
      {
        coverageCheckId: ladaCoverageCheck.id,
        extractedNewsId: ladaItems[0].id,
        csiRecordId: csiRecords[6].id,
        matchStatus: "TITLE_MISMATCH",
        matchScore: 0.76,
        evidence: JSON.stringify({ reason: "Similar URL but title wording differs strongly." }),
      },
      {
        coverageCheckId: ladaCoverageCheck.id,
        extractedNewsId: ladaItems[1].id,
        csiRecordId: null,
        matchStatus: "MISSING_IN_CSI",
        matchScore: 0,
        evidence: JSON.stringify({ reason: "No CSI record found for extracted item." }),
      },
      {
        coverageCheckId: ladaCoverageCheck.id,
        extractedNewsId: ladaItems[2].id,
        csiRecordId: null,
        matchStatus: "MISSING_IN_CSI",
        matchScore: 0,
        evidence: JSON.stringify({ reason: "No CSI record found for extracted item." }),
      },
      {
        coverageCheckId: ladaCoverageCheck.id,
        extractedNewsId: ladaItems[3].id,
        csiRecordId: null,
        matchStatus: "MISSING_IN_CSI",
        matchScore: 0,
        evidence: JSON.stringify({ reason: "No CSI record found for extracted item." }),
      },
    ],
  });

  const informCoverageCheck = await prisma.coverageCheck.create({
    data: {
      sourceId: sources["informburo.kz"].id,
      extractionRunId: informburoRun.id,
      csiBatchId: null,
      checkedAt: new Date("2026-05-03T11:15:00.000Z"),
      periodFrom: new Date("2026-05-03T00:00:00.000Z"),
      periodTo: new Date("2026-05-03T23:59:59.000Z"),
      status: "CSI_DATA_REQUIRED",
      sourceItemsCount: 7,
      csiItemsCount: 0,
      matchedCount: 0,
      missingCount: 0,
      duplicateCount: 0,
      mismatchCount: 0,
      coveragePercent: 0,
      summary: "Extraction succeeded, but CSI data batch was not provided for comparison.",
      createdById: users.ADMIN.id,
      createdAt: new Date("2026-05-03T11:15:01.000Z"),
    },
  });

  const issueExtraction = await prisma.dataIssue.create({
    data: {
      sourceId: sources["inaktau.kz"].id,
      coverageCheckId: null,
      entityId: String(inaktauRun.id),
      title: "inaktau.kz blocks extraction request with HTTP 403",
      issueType: "EXTRACTION_FAILED",
      severity: "CRITICAL",
      status: "NEW",
      evidence: JSON.stringify({ extractionRunId: inaktauRun.id, httpStatus: 403 }),
      recommendation: "Review access restrictions, headers and possible anti-bot behavior for the source.",
      createdById: users.ADMIN.id,
      assignedToId: users.ANALYST.id,
      createdAt: new Date("2026-05-03T10:45:00.000Z"),
    },
  });

  const issueDate = await prisma.dataIssue.create({
    data: {
      sourceId: sources["informburo.kz"].id,
      coverageCheckId: informCoverageCheck.id,
      entityId: String(informburoRun.id),
      title: "informburo.kz extraction returns partial publication dates",
      issueType: "DATE_SELECTOR_FAILED",
      severity: "HIGH",
      status: "NEW",
      evidence: JSON.stringify({ extractionRunId: informburoRun.id, itemsWithDate: 3, itemsFound: 7 }),
      recommendation: "Refine date selector and test the source again in Extraction Lab.",
      createdById: users.ADMIN.id,
      assignedToId: users.ANALYST.id,
      createdAt: new Date("2026-05-03T11:18:00.000Z"),
    },
  });

  const issueLadaMissing = await prisma.dataIssue.create({
    data: {
      sourceId: sources["lada.kz"].id,
      coverageCheckId: ladaCoverageCheck.id,
      entityId: String(ladaItems[1].id),
      title: "Several lada.kz items are missing in CSI after extraction",
      issueType: "MISSING_IN_CSI",
      severity: "HIGH",
      status: "IN_PROGRESS",
      evidence: JSON.stringify({ coverageCheckId: ladaCoverageCheck.id, missingCount: 3 }),
      recommendation: "Check parser schedule, source mapping and website registration in CSI.",
      createdById: users.ANALYST.id,
      assignedToId: users.ADMIN.id,
      createdAt: new Date("2026-05-03T09:25:00.000Z"),
    },
  });

  const issueCoverageReady = await prisma.dataIssue.create({
    data: {
      sourceId: sources["informburo.kz"].id,
      coverageCheckId: informCoverageCheck.id,
      entityId: String(informCoverageCheck.id),
      title: "CSI data batch is required before informburo.kz coverage validation",
      issueType: "CSI_DATA_REQUIRED",
      severity: "LOW",
      status: "IGNORED",
      evidence: JSON.stringify({ coverageCheckId: informCoverageCheck.id }),
      recommendation: "Upload export or use API mode before rerunning coverage.",
      createdById: users.ADMIN.id,
      assignedToId: null,
      createdAt: new Date("2026-05-03T11:19:00.000Z"),
    },
  });

  await prisma.task.createMany({
    data: [
      {
        title: "Investigate inaktau.kz access block",
        description: "Reproduce HTTP 403 and test alternative headers or timing.",
        status: "TODO",
        priority: "CRITICAL",
        dueDate: new Date("2026-05-04T09:00:00.000Z"),
        assignedToId: users.ANALYST.id,
        createdById: users.ADMIN.id,
        relatedIssueId: issueExtraction.id,
      },
      {
        title: "Refine informburo.kz date selector",
        description: "Use Extraction Lab to increase itemsWithDate coverage.",
        status: "DONE",
        priority: "HIGH",
        dueDate: new Date("2026-05-04T12:00:00.000Z"),
        assignedToId: users.ANALYST.id,
        createdById: users.ADMIN.id,
        relatedIssueId: issueDate.id,
      },
      {
        title: "Validate lada.kz source mapping in CSI",
        description: "Compare lada extracted items with latest CSI export filters.",
        status: "TODO",
        priority: "HIGH",
        dueDate: new Date("2026-05-05T08:00:00.000Z"),
        assignedToId: users.ADMIN.id,
        createdById: users.ANALYST.id,
        relatedIssueId: issueLadaMissing.id,
      },
      {
        title: "Prepare informburo.kz CSI export for recheck",
        description: "Upload a fresh CSI export for the same day before rerunning coverage validation.",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        dueDate: new Date("2026-05-04T14:00:00.000Z"),
        assignedToId: users.ADMIN.id,
        createdById: users.ANALYST.id,
        relatedIssueId: issueCoverageReady.id,
      },
      {
        title: "Review Aktobe regional sources marked for manual selector validation",
        description: "Check avestnik.kz, diapazon.kz and aqtobegazeti.kz for reusable selector patterns.",
        status: "TODO",
        priority: "MEDIUM",
        dueDate: new Date("2026-05-06T09:30:00.000Z"),
        assignedToId: users.ANALYST.id,
        createdById: users.ADMIN.id,
        relatedIssueId: null,
      },
      {
        title: "Document pavlodarnews.kz timeout evidence for escalation",
        description: "Prepare a short evidence summary with timeout details for IT follow-up.",
        status: "TODO",
        priority: "HIGH",
        dueDate: new Date("2026-05-05T11:00:00.000Z"),
        assignedToId: users.ADMIN.id,
        createdById: users.ANALYST.id,
        relatedIssueId: null,
      },
      {
        title: "Validate manual Tengrinews batch against import mapping template",
        description: "Confirm demo manual JSON field mapping stays aligned with coverage matcher expectations.",
        status: "DONE",
        priority: "LOW",
        dueDate: new Date("2026-05-03T16:00:00.000Z"),
        assignedToId: users.ADMIN.id,
        createdById: users.ADMIN.id,
        relatedIssueId: null,
      },
      {
        title: "Create follow-up note for duplicate CSI records trend",
        description: "Summarize duplicate pattern for the weekly parser QA handoff.",
        status: "IN_PROGRESS",
        priority: "LOW",
        dueDate: new Date("2026-05-06T13:00:00.000Z"),
        assignedToId: users.ANALYST.id,
        createdById: users.ADMIN.id,
        relatedIssueId: issueDuplicate.id,
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      {
        userId: users.ADMIN.id,
        action: "SEED",
        entity: "SYSTEM",
        entityId: "bootstrap",
        details: JSON.stringify({ message: "Parser Coverage Validator seed completed." }),
      },
      {
        userId: users.ANALYST.id,
        action: "CREATE",
        entity: "COVERAGE_CHECK",
        entityId: String(coverageCheck.id),
        details: JSON.stringify({ status: coverageCheck.status, coveragePercent: coverageCheck.coveragePercent }),
      },
      {
        userId: users.ADMIN.id,
        action: "CREATE",
        entity: "COVERAGE_CHECK",
        entityId: String(tengriCoverageCheck.id),
        details: JSON.stringify({ status: tengriCoverageCheck.status, coveragePercent: tengriCoverageCheck.coveragePercent }),
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed completed.");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
