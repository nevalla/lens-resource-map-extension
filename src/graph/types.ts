import type {
  ConfigMapV1,
  CronJobV1,
  DaemonSetV1,
  DeploymentV1,
  IngressV1,
  JobV1,
  PersistentVolumeClaimV1,
  PodV1,
  ReplicaSetV1,
  SecretV1,
  ServiceV1,
  StatefulSetV1,
} from "@k8slens/kubernetes-contracts";

export interface ClusterSnapshot {
  readonly pods: readonly PodV1[];
  readonly replicaSets: readonly ReplicaSetV1[];
  readonly deployments: readonly DeploymentV1[];
  readonly statefulSets: readonly StatefulSetV1[];
  readonly daemonSets: readonly DaemonSetV1[];
  readonly jobs: readonly JobV1[];
  readonly cronJobs: readonly CronJobV1[];
  readonly services: readonly ServiceV1[];
  readonly ingresses: readonly IngressV1[];
  readonly configMaps: readonly ConfigMapV1[];
  readonly secrets: readonly SecretV1[];
  readonly persistentVolumeClaims: readonly PersistentVolumeClaimV1[];
}

export type SnapshotKey = keyof ClusterSnapshot;

export type ServedResource = ClusterSnapshot[SnapshotKey][number];

export type NodeStatus = "ok" | "pending" | "error" | "terminated";

export interface GraphNode {
  readonly key: string;
  readonly kind: string;
  readonly apiVersion: string;
  readonly name: string;
  readonly namespace?: string;
  readonly status?: NodeStatus;
  // Absent for virtual nodes, such as a Helm release.
  readonly resource?: ServedResource;
}

export interface GraphEdge {
  readonly from: string;
  readonly to: string;
}

export interface ResourceGraph {
  readonly nodes: ReadonlyMap<string, GraphNode>;
  readonly edges: readonly GraphEdge[];
}

// A relation reads the snapshot and says which resources point at which.
// Nodes are only needed for resources that are not in the snapshot.
export interface RelationResult {
  readonly nodes?: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
}

export type Relation = (snapshot: ClusterSnapshot) => RelationResult;

export const nodeKey = (kind: string, namespace: string | undefined, name: string) =>
  `${kind}/${namespace ?? ""}/${name}`;

export const resourceKey = (resource: { kind: string; metadata: { name: string; namespace?: string } }) =>
  nodeKey(resource.kind, resource.metadata.namespace, resource.metadata.name);
