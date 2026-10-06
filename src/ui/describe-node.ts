import type { GraphNode, ServedResource } from "../graph/types";

export interface Description {
  readonly title: string;
  readonly rows: readonly (readonly [name: string, value: string])[];
}

const kindRows = (resource: ServedResource): [string, string][] => {
  switch (resource.kind) {
    case "Pod":
      return [
        ["Status", resource.status?.phase ?? "Unknown"],
        ["Node", resource.spec.nodeName ?? "-"],
        ["Containers", (resource.status?.containerStatuses ?? []).map((status) => `${status.name}${status.ready ? "" : " (not ready)"}`).join(", ")],
      ];
    case "Deployment":
    case "StatefulSet":
    case "ReplicaSet":
      return [["Replicas", `${resource.status?.readyReplicas ?? 0}/${resource.spec?.replicas ?? 1} ready`]];
    case "DaemonSet":
      return [["Pods", `${resource.status?.numberReady ?? 0}/${resource.status?.desiredNumberScheduled ?? 0} ready`]];
    case "CronJob":
      return [["Schedule", resource.spec?.schedule ?? "-"]];
    case "Service":
      return [
        ["Type", resource.spec?.type ?? "ClusterIP"],
        ["Cluster IP", resource.spec?.clusterIP ?? "-"],
        ["Ports", (resource.spec?.ports ?? []).map((port) => `${port.port}/${port.protocol ?? "TCP"}`).join(", ")],
      ];
    case "Ingress":
      return [["Hosts", (resource.spec?.rules ?? []).map((rule) => rule.host ?? "*").join(", ")]];
    case "Secret":
      return [["Type", resource.type ?? "Opaque"]];
    case "PersistentVolumeClaim":
      return [
        ["Status", resource.status?.phase ?? "-"],
        ["Storage", resource.spec?.resources?.requests?.storage ?? "-"],
      ];
    default:
      return [];
  }
};

export const describeNode = ({ kind, name, namespace, resource }: GraphNode): Description => ({
  title: `${kind}: ${name}`,
  rows: [
    ...(namespace ? [["Namespace", namespace] as const] : []),
    ...(resource ? kindRows(resource) : []),
    ...(resource?.metadata.creationTimestamp ? [["Created", new Date(resource.metadata.creationTimestamp).toLocaleString()] as const] : []),
  ].filter(([, value]) => value !== ""),
});
