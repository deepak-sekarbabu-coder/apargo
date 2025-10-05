// Server Component wrapper. We intentionally avoid using dynamic({ ssr:false }) here
// because that pattern is disallowed in Server Components. Instead we render a
// dedicated client component that handles fetching any client-only data.
import DashboardClient from './dashboard-client';

export default function DashboardPage() {
  return <DashboardClient />;
}
