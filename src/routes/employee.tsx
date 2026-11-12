import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { guard } from "@/components/layout/portal";

export const Route = createFileRoute("/employee")({
  ssr: false,
  beforeLoad: ({ location }) => guard(location.pathname),
  component: () => <AppShell role="EMPLOYEE"><Outlet /></AppShell>,
});
