import Card from "../components/common/Card";

function About() {
  return (
    <div className="page-grid">
      <Card title="About Parser Coverage Validator" subtitle="Internal QA platform for source extraction validation and CSI coverage checks.">
        <div className="prose-block">
          <h3>What the platform does</h3>
          <p>
            Parser Coverage Validator checks whether news published on a source website are actually present in CSI media monitoring data.
            It is built for analyst-side parser QA, evidence collection, and structured escalation to IT.
          </p>

          <h3>How it differs from a media monitoring dashboard</h3>
          <p>
            This project does not replicate publication analytics, sentiment, author rankings, or event dashboards. It focuses on extraction quality,
            source-site validation, CSI import review, match evidence, missing coverage, duplicates, and selector troubleshooting.
          </p>

          <h3>Where the data comes from</h3>
          <p>
            Source-site data is requested directly by the backend from configured news list pages using HTTP and selector-based extraction.
            CSI data enters the platform only through one of three explicit inputs: uploaded export file, provided API credentials, or manual JSON test data.
          </p>

          <h3>Why CSI data is required</h3>
          <p>
            Coverage validation compares extracted website news with CSI records. Without CSI export, API response, or manual JSON, the system can only
            test source extraction and must show the status “CSI data required for coverage check”.
          </p>

          <h3>How extraction works</h3>
          <p>
            Analysts configure selectors per source. The backend downloads the page, parses HTML with Cheerio, extracts title, link, and date fields,
            records evidence, and saves extraction history. If selectors fail, fallback link extraction can still show whether the page structure changed.
          </p>

          <h3>How coverage validation works</h3>
          <p>
            Coverage checks normalize URLs and titles, then compare source items with CSI records using exact URL match, similar slug logic, and title similarity.
            The result highlights matched items, missing news, duplicates, mismatches, and low-confidence matches with stored evidence.
          </p>

          <h3>Internship relevance</h3>
          <p>
            The project reflects practical analyst work in CSI Strategic consulting &amp; IT: verifying source parsing, documenting issues,
            preparing evidence for IT, tracking follow-up tasks, and organizing operational knowledge for the Data Analytics Department.
          </p>
        </div>
      </Card>
    </div>
  );
}

export default About;
