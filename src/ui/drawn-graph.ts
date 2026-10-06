import type { LinkObject, NodeObject } from "force-graph";
import type { GraphNode, ResourceGraph } from "../graph/types";

export interface DrawnNode extends NodeObject {
  id: string;
  node: GraphNode;
}

export type DrawnLink = LinkObject<DrawnNode> & { key: string };

export interface DrawnGraph {
  readonly nodes: DrawnNode[];
  readonly links: DrawnLink[];
}

const linkKey = (from: string, to: string) => `${from}>${to}`;

// The simulation keeps positions on the node objects, so a node that stays keeps its object.
export const nextDrawnGraph = (previous: DrawnGraph, graph: ResourceGraph) => {
  const previousNodes = new Map(previous.nodes.map((drawn) => [drawn.id, drawn]));

  const nodes = [...graph.nodes.values()].map((node) => {
    const drawn = previousNodes.get(node.key);

    if (drawn) {
      drawn.node = node;

      return drawn;
    }

    return { id: node.key, node };
  });

  const links = graph.edges.map((edge): DrawnLink => ({ key: linkKey(edge.from, edge.to), source: edge.from, target: edge.to }));

  const previousLinks = new Set(previous.links.map((link) => link.key));
  const isSameStructure =
    nodes.length === previous.nodes.length &&
    nodes.every((node) => previousNodes.has(node.id)) &&
    links.length === previousLinks.size &&
    links.every((link) => previousLinks.has(link.key));

  return { drawn: { nodes, links }, isSameStructure };
};

export const endpointKey = (endpoint: DrawnLink["source"]) =>
  typeof endpoint === "object" ? (endpoint as DrawnNode).id : String(endpoint);
