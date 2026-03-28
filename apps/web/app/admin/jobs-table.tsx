import { prisma } from "@repo/db";

export default async function AdminJobsTable() {
  const jobRuns = await prisma.jobRun.findMany({
    orderBy: { started_at: "desc" },
    take: 50,
  });

  if (jobRuns.length === 0) {
    return <p>No job runs yet.</p>;
  }

  return (
    <table style={{ borderCollapse: "collapse", width: "100%" }}>
      <thead>
        <tr style={{ borderBottom: "2px solid #000" }}>
          <th style={{ textAlign: "left" }}>Id</th>
          <th style={{ textAlign: "left" }}>Job</th>
          <th style={{ textAlign: "left" }}>Madrid Date</th>
          <th style={{ textAlign: "left" }}>Status</th>
          <th style={{ textAlign: "left" }}>Processed</th>
          <th style={{ textAlign: "left" }}>Failed</th>
          <th style={{ textAlign: "left" }}>Skipped</th>
          <th style={{ textAlign: "left" }}>Started At</th>
          <th style={{ textAlign: "left" }}>Finished At</th>
        </tr>
      </thead>
      <tbody>
        {jobRuns.map((jobRun) => (
          <tr key={jobRun.id} style={{ borderBottom: "1px solid #ccc" }}>
            <td>{jobRun.id}</td>
            <td>{jobRun.job_name}</td>
            <td>{jobRun.madrid_date}</td>
            <td>{jobRun.status}</td>
            <td>{jobRun.processed_count}</td>
            <td>{jobRun.failed_count}</td>
            <td>{jobRun.skipped_count}</td>
            <td>{new Date(jobRun.started_at).toLocaleString()}</td>
            <td>{jobRun.finished_at ? new Date(jobRun.finished_at).toLocaleString() : "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}