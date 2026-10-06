import type { PodV1 } from "@k8slens/kubernetes-contracts";
import type { NodeStatus, ServedResource } from "./types";

const failingReasons = new Set(["CrashLoopBackOff", "ImagePullBackOff", "ErrImagePull", "CreateContainerConfigError", "Error", "OOMKilled"]);

export const podStatus = (pod: PodV1): NodeStatus => {
  if (pod.metadata.deletionTimestamp) {
    return "terminated";
  }

  const containerStatuses = [...pod.status?.initContainerStatuses ?? [], ...pod.status?.containerStatuses ?? []];
  const reasons = containerStatuses.flatMap((status) => [status.state?.waiting?.reason, status.state?.terminated?.reason]);

  if (reasons.some((reason) => reason && failingReasons.has(reason))) {
    return "error";
  }

  switch (pod.status?.phase) {
    case "Running":
      return containerStatuses.every((status) => status.ready || status.state?.terminated) ? "ok" : "pending";
    case "Succeeded":
      return "terminated";
    case "Failed":
      return "error";
    default:
      return "pending";
  }
};

export const statusOf = (resource: ServedResource): NodeStatus | undefined => {
  switch (resource.kind) {
    case "Pod":
      return podStatus(resource);
    case "Deployment":
    case "StatefulSet":
    case "ReplicaSet":
      return (resource.status?.readyReplicas ?? 0) >= (resource.spec?.replicas ?? 1) ? "ok" : "pending";
    case "DaemonSet":
      return (resource.status?.numberReady ?? 0) >= (resource.status?.desiredNumberScheduled ?? 0) ? "ok" : "pending";
    case "Job":
      if (resource.status?.conditions?.some((condition) => condition.type === "Failed" && condition.status === "True")) {
        return "error";
      }

      return resource.status?.active ? "pending" : "ok";
    default:
      return undefined;
  }
};
