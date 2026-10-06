import { controllerOf } from "./relations/owner-references";
import { helmReleaseKind, helmReleaseSecretType } from "./relations/helm-releases";
import { statusOf } from "./status";
import {
  type ClusterSnapshot,
  type GraphEdge,
  type GraphNode,
  type Relation,
  type ResourceGraph,
  resourceKey,
  type ServedResource,
} from "./types";

// Shared configuration is only interesting for what uses it.
const shownOnlyWhenConnected = new Set(["ConfigMap", "Secret", helmReleaseKind]);

const hiddenSecretTypes = new Set(["kubernetes.io/service-account-token", helmReleaseSecretType]);

const isHidden = (resource: ServedResource) => {
  switch (resource.kind) {
    case "ReplicaSet":
      return Boolean(controllerOf(resource.metadata.ownerReferences, "Deployment"));
    case "Secret":
      return hiddenSecretTypes.has(resource.type ?? "");
    default:
      return false;
  }
};

const toNode = (resource: ServedResource): GraphNode => ({
  key: resourceKey(resource),
  kind: resource.kind,
  apiVersion: resource.apiVersion,
  name: resource.metadata.name,
  namespace: resource.metadata.namespace,
  status: statusOf(resource),
  resource,
});

// `namespaces` empty means every namespace.
export const buildGraph = (
  snapshot: ClusterSnapshot,
  relations: readonly Relation[],
  namespaces: readonly string[],
): ResourceGraph => {
  const isInScope = (node: GraphNode) => namespaces.length === 0 || namespaces.includes(node.namespace ?? "");
  const results = relations.map((relation) => relation(snapshot));

  const candidates = [
    ...Object.values(snapshot)
      .flat()
      .filter((resource: ServedResource) => !isHidden(resource))
      .map(toNode),
    ...results.flatMap((result) => result.nodes ?? []),
  ].filter(isInScope);

  const nodes = new Map(candidates.map((node) => [node.key, node]));
  const edges = uniqueEdges(results.flatMap((result) => result.edges)).filter(
    (edge) => edge.from !== edge.to && nodes.has(edge.from) && nodes.has(edge.to),
  );

  const connected = new Set(edges.flatMap((edge) => [edge.from, edge.to]));

  for (const node of nodes.values()) {
    if (shownOnlyWhenConnected.has(node.kind) && !connected.has(node.key)) {
      nodes.delete(node.key);
    }
  }

  return { nodes, edges };
};

const uniqueEdges = (edges: readonly GraphEdge[]) => [
  ...new Map(edges.map((edge) => [`${edge.from}>${edge.to}`, edge])).values(),
];
