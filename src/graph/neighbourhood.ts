import { helmReleaseKind } from "./relations/helm-releases";
import type { GraphEdge, ResourceGraph } from "./types";

// Shared by many unrelated workloads: walking through one would pull them all in.
const hubKinds = new Set(["ConfigMap", "Secret", "PersistentVolumeClaim", helmReleaseKind]);

const defaultDepth = 3;

// The resources reachable from `start` in either direction, without passing through a hub.
export const neighbourhood = (graph: ResourceGraph, start: string, depth = defaultDepth): ResourceGraph => {
  if (!graph.nodes.has(start)) {
    return { nodes: new Map(), edges: [] };
  }

  const adjacent = adjacencyOf(graph.edges);
  const reached = new Set([start]);
  let frontier = [start];

  for (let step = 0; step < depth && frontier.length > 0; step++) {
    frontier = frontier
      .filter((key) => key === start || !hubKinds.has(graph.nodes.get(key)?.kind ?? ""))
      .flatMap((key) => adjacent.get(key) ?? [])
      .filter((key) => !reached.has(key));

    frontier.forEach((key) => reached.add(key));
  }

  return {
    nodes: new Map([...graph.nodes].filter(([key]) => reached.has(key))),
    edges: graph.edges.filter((edge) => reached.has(edge.from) && reached.has(edge.to)),
  };
};

const adjacencyOf = (edges: readonly GraphEdge[]) => {
  const adjacent = new Map<string, string[]>();
  const link = (from: string, to: string) => {
    const keys = adjacent.get(from);

    if (keys) {
      keys.push(to);
    } else {
      adjacent.set(from, [to]);
    }
  };

  edges.forEach((edge) => {
    link(edge.from, edge.to);
    link(edge.to, edge.from);
  });

  return adjacent;
};
