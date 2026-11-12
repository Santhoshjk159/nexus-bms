import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSession, HOME } from "@/lib/auth";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({ meta: [{ title: "NEXUS BANK — Enterprise Core Banking" }, { name: "description", content: "Enterprise core banking platform demo." }, { property: "og:title", content: "NEXUS BANK" }, { property: "og:description", content: "Enterprise core banking platform demo." }] }),
  beforeLoad: () => { const s = getSession(); throw redirect({ to: s ? HOME[s.role] : "/login" }); },
});
