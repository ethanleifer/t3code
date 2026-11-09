import { createFileRoute } from "@tanstack/react-router";
import { AreasPage } from "../components/areas/AreasPage";

export const Route = createFileRoute("/_chat/areas")({ component: AreasPage });
