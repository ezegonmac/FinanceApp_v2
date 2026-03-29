import AdminJobsPanel from "./jobs-panel";
import AdminJobsTable from "./jobs-table";
import DebugToggle from "@/components/debug/DebugToggle";

export default function AdminPage() {
  return (
    <div>
      <h1>Admin</h1>
      <p>Manual operations for maintenance tasks.</p>

      <h2>Debug Mode</h2>
      <DebugToggle />

      <br />
      <br />

      <AdminJobsPanel />
      <br />
      <h2>Job Runs</h2>
      <AdminJobsTable />
    </div>
  );
}
