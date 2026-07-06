import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/ferramentas/")({
  beforeLoad: () => {
    throw redirect({ to: "/ferramentas/gerador" });
  },
});
