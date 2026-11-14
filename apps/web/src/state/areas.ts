import { WS_METHODS } from "@t3tools/contracts";
import {
  createEnvironmentRpcCommand,
  createEnvironmentRpcQueryAtomFamily,
} from "@t3tools/client-runtime/state/runtime";
import { connectionAtomRuntime } from "../connection/runtime";

export const areasList = createEnvironmentRpcQueryAtomFamily(connectionAtomRuntime, {
  label: "environment-data:areas:list",
  tag: WS_METHODS.areasList,
  staleTimeMs: 5_000,
  idleTtlMs: 60_000,
});
export const areaSave = createEnvironmentRpcCommand(connectionAtomRuntime, {
  label: "environment-data:areas:save",
  tag: WS_METHODS.areasSave,
});
export const areaRemove = createEnvironmentRpcCommand(connectionAtomRuntime, {
  label: "environment-data:areas:remove",
  tag: WS_METHODS.areasRemove,
});
