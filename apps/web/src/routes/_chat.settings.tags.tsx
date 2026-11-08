import { createFileRoute } from "@tanstack/react-router";
import { TagsSettingsPanel } from "../components/settings/TagsSettings";

export const Route = createFileRoute("/_chat/settings/tags")({ component: TagsSettingsPanel });
