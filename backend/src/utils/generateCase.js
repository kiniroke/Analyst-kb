const rules = {
  PARSING_ERROR: {
    title: "Parsing error detected",
    recommendedAction:
      "Review the page structure and update extraction rules for the affected field or block.",
    itComment:
      "During validation, the source returned incomplete or invalid parsed output. Please review the extraction selectors and current source structure.",
    reportNote:
      "The issue may reduce completeness of collected publications and field accuracy for the affected source.",
    suggestedPriority: "HIGH",
    taskTitle: "Review parser configuration",
  },
  MISSING_DATE: {
    title: "Missing publication date detected",
    recommendedAction:
      "Check the publication date block and update extraction rules if the page structure has changed.",
    itComment:
      "During validation, the publication date was not extracted correctly for the selected source. Please review the date selector or API response field.",
    reportNote:
      "The issue may affect chronological analysis and publication timeline accuracy.",
    suggestedPriority: "HIGH",
    taskTitle: "Validate date extraction rule",
  },
  MISSING_TEXT: {
    title: "Missing article text detected",
    recommendedAction:
      "Inspect the article body block and confirm whether the content is rendered dynamically or moved to a different selector.",
    itComment:
      "The publication record is missing article body text. Please review the current content selector and rendering requirements for the source.",
    reportNote:
      "Missing text can reduce the analytical value of publications and affect text-based review workflows.",
    suggestedPriority: "HIGH",
    taskTitle: "Restore article text extraction",
  },
  INCORRECT_URL: {
    title: "Incorrect source URL detected",
    recommendedAction:
      "Verify the registered URL against the current live source and update the source registry with the valid canonical address.",
    itComment:
      "The registered source URL appears incorrect or outdated. Please confirm the valid address and update the source registry.",
    reportNote:
      "An incorrect URL may break source validation workflows and prevent stable parsing.",
    suggestedPriority: "MEDIUM",
    taskTitle: "Confirm canonical source URL",
  },
  DUPLICATE_SOURCE: {
    title: "Potential duplicate source detected",
    recommendedAction:
      "Compare source name and URL with existing records and merge duplicates if needed.",
    itComment:
      "A potential duplicate source was detected. Please verify whether the records refer to the same source.",
    reportNote:
      "Duplicate sources may affect publication counts and source statistics.",
    suggestedPriority: "MEDIUM",
    taskTitle: "Run duplicate source review",
  },
  MISSING_REGION: {
    title: "Missing regional metadata detected",
    recommendedAction:
      "Verify the source profile and assign the correct regional relation.",
    itComment:
      "The account/source has incomplete regional metadata. Please update the source registry after manual confirmation.",
    reportNote:
      "Missing regional information may affect regional analytics and filtering accuracy.",
    suggestedPriority: "MEDIUM",
    taskTitle: "Confirm source region assignment",
  },
  API_RESPONSE_ERROR: {
    title: "API response issue detected",
    recommendedAction:
      "Check request method, parameters, response code and response structure.",
    itComment:
      "The API response does not match the expected structure. Please review request parameters and returned fields.",
    reportNote:
      "API response issues may affect completeness of collected data.",
    suggestedPriority: "CRITICAL",
    taskTitle: "Inspect API integration response",
  },
  SOCIAL_ACCOUNT_INCOMPLETE: {
    title: "Incomplete social account data detected",
    recommendedAction:
      "Review the account metadata and manually confirm follower count, region, watcher, and account naming details.",
    itComment:
      "The selected social account contains incomplete or inconsistent profile metadata. Please review the registry entry and update missing fields.",
    reportNote:
      "Incomplete social account metadata can reduce the accuracy of source attribution and workload distribution.",
    suggestedPriority: "MEDIUM",
    taskTitle: "Complete social account metadata",
  },
  DATA_QUALITY: {
    title: "Data quality issue detected",
    recommendedAction:
      "Review the affected record, confirm the scope of the problem, and document the corrective update required.",
    itComment:
      "A data quality issue was identified during analyst review. Please verify the affected record and apply the required correction.",
    reportNote:
      "This issue may affect analytical consistency until the underlying record is corrected and rechecked.",
    suggestedPriority: "MEDIUM",
    taskTitle: "Review data quality exception",
  },
  OTHER: {
    title: "Operational issue detected",
    recommendedAction:
      "Complete a manual review, document evidence, and define the next action with the responsible team.",
    itComment:
      "An analyst identified an issue that requires manual review. Please investigate the attached details and advise on the appropriate fix.",
    reportNote:
      "The issue is under review and may have temporary impact on data reliability for the affected object.",
    suggestedPriority: "LOW",
    taskTitle: "Review operational issue",
  },
};

function generateCase(payload) {
  const {
    sourceName,
    sourceType,
    region,
    issueCategory,
    priority,
    shortDescription,
    analystNote,
  } = payload;

  const rule = rules[issueCategory] || rules.OTHER;
  const title = `${rule.title} for ${sourceName}`;
  const descriptionParts = [
    `Source: ${sourceName}`,
    `Source type: ${sourceType}`,
    region ? `Region: ${region}` : null,
    `Issue summary: ${shortDescription}`,
    analystNote ? `Analyst note: ${analystNote}` : null,
  ].filter(Boolean);

  return {
    title,
    description: descriptionParts.join(". "),
    recommendedAction: rule.recommendedAction,
    itComment: rule.itComment,
    reportNote: rule.reportNote,
    suggestedPriority: priority || rule.suggestedPriority,
    suggestedTaskTitle: `${rule.taskTitle}: ${sourceName}`,
  };
}

module.exports = {
  generateCase,
};
