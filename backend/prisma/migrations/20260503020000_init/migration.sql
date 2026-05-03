-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "department" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NewsSource" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "newsListUrl" TEXT,
    "normalizedUrl" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "aggregationLevel" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "region" TEXT,
    "language" TEXT,
    "watcher" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "titleSelector" TEXT,
    "linkSelector" TEXT,
    "dateSelector" TEXT,
    "containerSelector" TEXT,
    "lastExtractionStatus" TEXT NOT NULL DEFAULT 'NOT_TESTED',
    "lastExtractedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ExtractionRun" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sourceId" INTEGER NOT NULL,
    "startedAt" DATETIME NOT NULL,
    "finishedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'NOT_TESTED',
    "pageUrl" TEXT NOT NULL,
    "httpStatus" INTEGER,
    "responseTimeMs" INTEGER,
    "itemsFound" INTEGER NOT NULL DEFAULT 0,
    "itemsWithTitle" INTEGER NOT NULL DEFAULT 0,
    "itemsWithUrl" INTEGER NOT NULL DEFAULT 0,
    "itemsWithDate" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "evidenceJson" TEXT,
    "createdById" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExtractionRun_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "NewsSource" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExtractionRun_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExtractedNewsItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sourceId" INTEGER NOT NULL,
    "extractionRunId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "normalizedUrl" TEXT NOT NULL,
    "publishedAt" DATETIME,
    "rawDate" TEXT,
    "position" INTEGER,
    "extractedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExtractedNewsItem_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "NewsSource" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExtractedNewsItem_extractionRunId_fkey" FOREIGN KEY ("extractionRunId") REFERENCES "ExtractionRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CsiDataBatch" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mode" TEXT NOT NULL,
    "fileName" TEXT,
    "apiEndpoint" TEXT,
    "periodFrom" DATETIME,
    "periodTo" DATETIME,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "successfulRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "sourceLabel" TEXT,
    "notes" TEXT,
    "uploadedById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CsiDataBatch_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CsiRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "batchId" INTEGER NOT NULL,
    "sourceName" TEXT,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "normalizedUrl" TEXT,
    "publishedAt" DATETIME,
    "rawDate" TEXT,
    "author" TEXT,
    "platform" TEXT,
    "tone" TEXT,
    "region" TEXT,
    "importedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CsiRecord_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "CsiDataBatch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CoverageCheck" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sourceId" INTEGER NOT NULL,
    "extractionRunId" INTEGER NOT NULL,
    "csiBatchId" INTEGER,
    "checkedAt" DATETIME NOT NULL,
    "periodFrom" DATETIME,
    "periodTo" DATETIME,
    "status" TEXT NOT NULL,
    "sourceItemsCount" INTEGER NOT NULL DEFAULT 0,
    "csiItemsCount" INTEGER NOT NULL DEFAULT 0,
    "matchedCount" INTEGER NOT NULL DEFAULT 0,
    "missingCount" INTEGER NOT NULL DEFAULT 0,
    "duplicateCount" INTEGER NOT NULL DEFAULT 0,
    "mismatchCount" INTEGER NOT NULL DEFAULT 0,
    "coveragePercent" REAL NOT NULL DEFAULT 0,
    "summary" TEXT,
    "createdById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CoverageCheck_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "NewsSource" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CoverageCheck_extractionRunId_fkey" FOREIGN KEY ("extractionRunId") REFERENCES "ExtractionRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CoverageCheck_csiBatchId_fkey" FOREIGN KEY ("csiBatchId") REFERENCES "CsiDataBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CoverageCheck_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CoverageMatchResult" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "coverageCheckId" INTEGER NOT NULL,
    "extractedNewsId" INTEGER,
    "csiRecordId" INTEGER,
    "matchStatus" TEXT NOT NULL,
    "matchScore" REAL NOT NULL DEFAULT 0,
    "evidence" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CoverageMatchResult_coverageCheckId_fkey" FOREIGN KEY ("coverageCheckId") REFERENCES "CoverageCheck" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CoverageMatchResult_extractedNewsId_fkey" FOREIGN KEY ("extractedNewsId") REFERENCES "ExtractedNewsItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CoverageMatchResult_csiRecordId_fkey" FOREIGN KEY ("csiRecordId") REFERENCES "CsiRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DataIssue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sourceId" INTEGER NOT NULL,
    "coverageCheckId" INTEGER,
    "entityId" TEXT,
    "title" TEXT NOT NULL,
    "issueType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "evidence" TEXT,
    "recommendation" TEXT,
    "createdById" INTEGER NOT NULL,
    "assignedToId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DataIssue_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "NewsSource" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DataIssue_coverageCheckId_fkey" FOREIGN KEY ("coverageCheckId") REFERENCES "CoverageCheck" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DataIssue_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DataIssue_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "dueDate" DATETIME,
    "assignedToId" INTEGER,
    "createdById" INTEGER NOT NULL,
    "relatedIssueId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_relatedIssueId_fkey" FOREIGN KEY ("relatedIssueId") REFERENCES "DataIssue" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KnowledgeArticle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "steps" TEXT NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KnowledgeArticle_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "NewsSource_name_key" ON "NewsSource"("name");

-- CreateIndex
CREATE INDEX "ExtractionRun_sourceId_createdAt_idx" ON "ExtractionRun"("sourceId", "createdAt");

-- CreateIndex
CREATE INDEX "ExtractedNewsItem_sourceId_extractionRunId_idx" ON "ExtractedNewsItem"("sourceId", "extractionRunId");

-- CreateIndex
CREATE INDEX "CsiRecord_batchId_title_idx" ON "CsiRecord"("batchId", "title");

-- CreateIndex
CREATE INDEX "CoverageCheck_sourceId_checkedAt_idx" ON "CoverageCheck"("sourceId", "checkedAt");

-- CreateIndex
CREATE INDEX "DataIssue_sourceId_issueType_status_idx" ON "DataIssue"("sourceId", "issueType", "status");

