import type { PodV1, V1Container } from "@k8slens/kubernetes-contracts";
import { type GraphEdge, nodeKey, type Relation, resourceKey } from "../types";

// Every namespace has it, and every pod mounts it for its service account token.
const clusterCaConfigMap = "kube-root-ca.crt";

type ReferencedKind = "ConfigMap" | "Secret" | "PersistentVolumeClaim";

type Reference = readonly [kind: ReferencedKind, name: string | undefined];

export const podReferences: Relation = (snapshot) => {
  const edges = snapshot.pods.flatMap((pod): GraphEdge[] =>
    referencesOf(pod)
      .flatMap(([kind, name]) => (name && !(kind === "ConfigMap" && name === clusterCaConfigMap) ? [{ kind, name }] : []))
      .map(({ kind, name }) => ({ from: resourceKey(pod), to: nodeKey(kind, pod.metadata.namespace, name) })),
  );

  return { edges };
};

const referencesOf = (pod: PodV1): Reference[] => {
  const containers = [...pod.spec.initContainers ?? [], ...pod.spec.containers];

  return [...containers.flatMap(containerReferences), ...volumeReferences(pod)];
};

const containerReferences = (container: V1Container): Reference[] => [
  ...(container.env ?? []).flatMap((env): Reference[] => [
    ["ConfigMap", env.valueFrom?.configMapKeyRef?.name],
    ["Secret", env.valueFrom?.secretKeyRef?.name],
  ]),
  ...(container.envFrom ?? []).flatMap((envFrom): Reference[] => [
    ["ConfigMap", envFrom.configMapRef?.name],
    ["Secret", envFrom.secretRef?.name],
  ]),
];

const volumeReferences = (pod: PodV1): Reference[] =>
  (pod.spec.volumes ?? []).flatMap((volume): Reference[] => [
    ["ConfigMap", volume.configMap?.name],
    ["Secret", volume.secret?.secretName],
    ["PersistentVolumeClaim", volume.persistentVolumeClaim?.claimName],
    ...(volume.projected?.sources ?? []).flatMap((source): Reference[] => [
      ["ConfigMap", source.configMap?.name],
      ["Secret", source.secret?.name],
    ]),
  ]);
