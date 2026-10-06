import type { PodV1 } from "@k8slens/kubernetes-contracts";
import { type Relation, resourceKey } from "../types";

export const serviceSelector: Relation = (snapshot) => {
  const podsByNamespace = new Map<string, PodV1[]>();

  snapshot.pods.forEach((pod) => {
    const pods = podsByNamespace.get(pod.metadata.namespace);

    if (pods) {
      pods.push(pod);
    } else {
      podsByNamespace.set(pod.metadata.namespace, [pod]);
    }
  });

  const edges = snapshot.services.flatMap((service) => {
    const selector = Object.entries(service.spec?.selector ?? {});

    // A service without a selector has its endpoints managed by hand: it selects no pods.
    if (selector.length === 0) {
      return [];
    }

    return (podsByNamespace.get(service.metadata.namespace) ?? [])
      .filter((pod) => selector.every(([key, value]) => pod.metadata.labels?.[key] === value))
      .map((pod) => ({ from: resourceKey(service), to: resourceKey(pod) }));
  });

  return { edges };
};
