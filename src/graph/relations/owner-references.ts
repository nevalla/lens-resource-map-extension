import type { V1OwnerReference } from "@k8slens/kubernetes-contracts";
import { type GraphEdge, nodeKey, type Relation, resourceKey } from "../types";

// A ReplicaSet owned by a Deployment is an implementation detail of the
// Deployment, so its pods are drawn as the Deployment's own.
export const ownerReferences: Relation = (snapshot) => {
  const deploymentOfReplicaSet = new Map(
    snapshot.replicaSets.flatMap((replicaSet) => {
      const deployment = controllerOf(replicaSet.metadata.ownerReferences, "Deployment");

      return deployment ? [[resourceKey(replicaSet), nodeKey("Deployment", replicaSet.metadata.namespace, deployment.name)]] : [];
    }),
  );

  const owned = [...snapshot.pods, ...snapshot.replicaSets, ...snapshot.jobs];

  const edges = owned.flatMap((resource): GraphEdge[] => {
    const { namespace, ownerReferences: owners = [] } = resource.metadata;

    return owners.map((owner) => {
      const ownerKey = nodeKey(owner.kind, namespace, owner.name);

      return { from: deploymentOfReplicaSet.get(ownerKey) ?? ownerKey, to: resourceKey(resource) };
    });
  });

  return { edges };
};

export const controllerOf = (owners: readonly V1OwnerReference[] | undefined, kind: string) =>
  owners?.find((owner) => owner.kind === kind && owner.controller);
