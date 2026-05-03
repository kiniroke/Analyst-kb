import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import client from "../api/client";
import Badge from "../components/common/Badge";
import Card from "../components/common/Card";
import DataTable from "../components/common/DataTable";
import EmptyState from "../components/common/EmptyState";
import LoadingState from "../components/common/LoadingState";
import StatCard from "../components/common/StatCard";
import { formatDate, formatPercent, humanizeEnum } from "../helpers";

function truncateLabel(value, max = 18) {
  const text = humanizeEnum(value);
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    client
      .get("/reports/summary")
      .then(({ data: response }) => setData(response))
      .catch((requestError) => setError(requestError.response?.data?.message || "Failed to load dashboard."));
  }, []);

  if (error) {
    return <Card title="Dashboard"><div className="error-text">{error}</div></Card>;
  }

  if (!data) {
    return <LoadingState label="Loading dashboard..." />;
  }

  const priorityRows = data.criticalIssues.length ? data.criticalIssues : data.recentIssues;
  const operationalFocus = [
    `${data.cards.sourcesNeedingReview} source(s) require selector review or validation.`,
    `${data.cards.missingInCsiCount} extracted item(s) are currently missing in CSI data.`,
    `${data.cards.errorExtractionRuns} extraction run(s) ended with ERROR and need investigation.`,
  ];
  const workflowPressure = [
    { name: "Open issues", value: data.cards.openIssues },
    { name: "Open tasks", value: data.cards.openTasks },
    { name: "Missing in CSI", value: data.cards.missingInCsiCount },
    { name: "Extraction errors", value: data.cards.errorExtractionRuns },
  ];

  return (
    <div className="page-grid">
      <section className="dashboard-hero card">
        <div className="dashboard-hero-main">
          <div className="dashboard-kicker">Operations Overview</div>
          <h2>Parser coverage control center</h2>
          <p>
            Use this screen to understand source health, extraction quality, CSI coverage gaps and current analyst workload
            before drilling down into source, coverage or issue pages.
          </p>
          <div className="dashboard-hero-chips">
            <span className="hero-chip">57 registered sources</span>
            <span className="hero-chip">Live extraction evidence</span>
            <span className="hero-chip">CSI export, API and manual modes</span>
          </div>
        </div>

        <div className="dashboard-hero-side">
          <div className="hero-metric hero-metric-blue">
            <span>Average coverage</span>
            <strong>{formatPercent(data.cards.averageCoveragePercent)}</strong>
          </div>
          <div className="hero-metric hero-metric-red">
            <span>Missing in CSI</span>
            <strong>{data.cards.missingInCsiCount}</strong>
          </div>
          <div className="hero-metric hero-metric-amber">
            <span>Sources needing review</span>
            <strong>{data.cards.sourcesNeedingReview}</strong>
          </div>
          <div className="hero-panel">
            <div className="hero-panel-title">Today&apos;s operational snapshot</div>
            <div className="hero-panel-grid">
              <div><strong>{data.cards.sourcesTestedToday}</strong><span>Extraction tests</span></div>
              <div><strong>{data.cards.coverageChecks}</strong><span>Coverage checks</span></div>
              <div><strong>{data.cards.csiBatchesUploaded}</strong><span>CSI batches</span></div>
              <div><strong>{data.cards.openTasks}</strong><span>Follow-up tasks</span></div>
            </div>
          </div>
        </div>
      </section>

      <div className="spotlight-grid">
        <div className="spotlight-card spotlight-red">
          <div className="spotlight-label">Extraction Risk</div>
          <div className="spotlight-value">{data.cards.errorExtractionRuns}</div>
          <p>Sources with recent hard extraction failure that may require access review or selector correction.</p>
        </div>
        <div className="spotlight-card spotlight-amber">
          <div className="spotlight-label">Coverage Gaps</div>
          <div className="spotlight-value">{data.cards.openIssues}</div>
          <p>Open parser or coverage issues that should be reviewed before preparing analytical reporting.</p>
        </div>
        <div className="spotlight-card spotlight-blue">
          <div className="spotlight-label">Follow-up Work</div>
          <div className="spotlight-value">{data.cards.openTasks}</div>
          <p>Tasks still in progress across analysts, linked to issues or source verification activity.</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Total sources" value={data.cards.totalSources} hint="All registered monitored websites." />
        <StatCard label="Sources tested today" value={data.cards.sourcesTestedToday} hint="Extraction runs saved since midnight." />
        <StatCard label="CSI batches uploaded" value={data.cards.csiBatchesUploaded} hint="Export, API and manual demo batches." />
        <StatCard label="Coverage checks" value={data.cards.coverageChecks} hint="Saved source-to-CSI comparison runs." />
        <StatCard label="Open issues" value={data.cards.openIssues} hint="NEW and IN PROGRESS parser issues." />
        <StatCard label="Open tasks" value={data.cards.openTasks} hint="Outstanding follow-up work items." />
      </div>

      <Card title="Operational Focus" subtitle="This block explains what needs attention right now.">
        <div className="focus-list">
          {operationalFocus.map((item) => (
            <div key={item} className="focus-item">{item}</div>
          ))}
        </div>
      </Card>

      <div className="chart-grid dashboard-chart-grid">
        <Card
          className="chart-card chart-card-navy"
          title="Coverage Percent By Source"
          subtitle="Shows how much of extracted source news was found in CSI for each checked source."
        >
          {data.charts.coverageBySource.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.charts.coverageBySource} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="source" width={90} tickFormatter={(value) => truncateLabel(value, 14)} />
                <Tooltip />
                <Bar dataKey="coveragePercent" fill="#1f4f84" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No coverage data" description="Run coverage checks to populate this chart." />
          )}
        </Card>

        <Card className="chart-card chart-card-green" title="Extraction Statuses" subtitle="Shows how many saved extraction runs ended as OK, WARNING or ERROR.">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.charts.extractionStatuses}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" tickFormatter={humanizeEnum} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#1d6b48" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="chart-card chart-card-blue" title="Coverage Check Statuses" subtitle="Shows whether completed source comparisons ended as OK, PARTIAL, FAILED or CSI data required.">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.charts.coverageStatuses}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" tickFormatter={(value) => truncateLabel(value, 14)} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b5cc9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="chart-card chart-card-amber" title="Match Statuses" subtitle="Shows how extracted news items were classified during coverage checks.">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.charts.matchStatuses} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="status" width={110} tickFormatter={(value) => truncateLabel(value, 16)} />
              <Tooltip />
              <Bar dataKey="count" fill="#d18a1b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="chart-card chart-card-red" title="Issues By Type" subtitle="Shows what kinds of parser and coverage problems are currently registered.">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.charts.issuesByType} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="issueType" width={120} tickFormatter={(value) => truncateLabel(value, 18)} />
              <Tooltip />
              <Bar dataKey="count" fill="#b94848" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="chart-card chart-card-slate" title="Source Registry Status" subtitle="Shows how many sources are active, disabled or currently marked for review.">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.charts.sourceStatuses}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" tickFormatter={humanizeEnum} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#7a879a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="chart-card chart-card-indigo" title="Task Statuses" subtitle="Shows how follow-up work is distributed across TO DO, IN PROGRESS and DONE.">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.charts.tasksByStatus}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" tickFormatter={humanizeEnum} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b5cc9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="chart-card chart-card-plum" title="Open Work Queue" subtitle="Shows where current analyst attention is concentrated right now.">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={workflowPressure}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" interval={0} angle={-10} textAnchor="end" height={56} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#6b4bb6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="table-grid">
        <Card title="Recent Extraction Runs">
          <DataTable
            columns={[
              { key: "source", header: "Source", render: (row) => row.source.name },
              { key: "status", header: "Status", render: (row) => <Badge value={row.status} /> },
              { key: "itemsFound", header: "Items found" },
              { key: "createdAt", header: "Run time", render: (row) => formatDate(row.createdAt) },
            ]}
            rows={data.recentExtractionRuns}
          />
        </Card>

        <Card title="Recent Coverage Checks">
          <DataTable
            columns={[
              { key: "source", header: "Source", render: (row) => row.source.name },
              { key: "status", header: "Status", render: (row) => <Badge value={row.status} /> },
              { key: "coveragePercent", header: "Coverage", render: (row) => formatPercent(row.coveragePercent) },
              { key: "checkedAt", header: "Checked at", render: (row) => formatDate(row.checkedAt) },
            ]}
            rows={data.recentCoverageChecks}
          />
        </Card>

        <Card
          title={data.criticalIssues.length ? "Critical Parser Issues" : "Recent Open Issues"}
          subtitle={
            data.criticalIssues.length
              ? "Highest-priority problems that should be shown to IT or reviewed first."
              : "No critical issues yet, so the newest open issues are shown instead."
          }
        >
          <DataTable
            columns={[
              { key: "title", header: "Issue" },
              { key: "source", header: "Source", render: (row) => row.source.name },
              { key: "severity", header: "Severity", render: (row) => <Badge value={row.severity} /> },
              { key: "createdAt", header: "Created", render: (row) => formatDate(row.createdAt) },
            ]}
            rows={priorityRows}
          />
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
