import { type GraphEdge, type GraphNode, nodeKey, type Relation, resourceKey, type ServedResource } from "../types";

export const helmReleaseKind = "HelmRelease";
export const helmReleaseSecretType = "helm.sh/release.v1";

// Helm annotates what it installs since 3.2; before that it labelled it, as "Tiller" in Helm 2.
const legacyHeritages = new Set(["Helm", "Tiller"]);

const releaseOf = ({ metadata }: ServedResource) => {
  const name =
    metadata.annotations?.["meta.helm.sh/release-name"] ??
    (legacyHeritages.has(metadata.labels?.heritage ?? "") ? metadata.labels?.release : undefined);

  return name ? { name, namespace: metadata.annotations?.["meta.helm.sh/release-namespace"] ?? metadata.namespace } : undefined;
};

// Charts often copy the release labels into pod templates; the controller already carries the edge.
const hasController = ({ metadata }: ServedResource) => Boolean(metadata.ownerReferences?.some((owner) => owner.controller));

export const helmReleases: Relation = (snapshot) => {
  const resources: ServedResource[] = Object.values(snapshot).flat();
  const nodes = new Map<string, GraphNode>();

  const edges = resources
    .filter((resource) => !hasController(resource))
    .flatMap((resource): GraphEdge[] => {
      const release = releaseOf(resource);

      if (!release) {
        return [];
      }

      const key = nodeKey(helmReleaseKind, release.namespace, release.name);

      nodes.set(key, { key, kind: helmReleaseKind, apiVersion: "helm.sh/v3", ...release });

      return [{ from: key, to: resourceKey(resource) }];
    });

  return { nodes: [...nodes.values()], edges };
};
