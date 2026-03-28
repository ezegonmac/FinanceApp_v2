import AdminJobsPanel from "./jobs-panel";
import AdminJobsTable from "./jobs-table";

export default function AdminPage() {
  return (
    <div>
      <h1>Admin</h1>
      <p>Manual operations for maintenance tasks.</p>
      <AdminJobsPanel />
      <br />
      <h2>Job Runs</h2>
      <AdminJobsTable />
    </div>
  );
}
