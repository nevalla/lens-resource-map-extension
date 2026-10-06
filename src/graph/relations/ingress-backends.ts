import type { V1IngressBackend } from "@k8slens/kubernetes-contracts";
import { type GraphEdge, nodeKey, type Relation, resourceKey } from "../types";

export const ingressBackends: Relation = (snapshot) => {
  const edges = snapshot.ingresses.flatMap((ingress): GraphEdge[] => {
    const { namespace } = ingress.metadata;
    const from = resourceKey(ingress);

    const backends: (V1IngressBackend | undefined)[] = [
      ingress.spec?.defaultBackend,
      ...(ingress.spec?.rules ?? []).flatMap((rule) => (rule.http?.paths ?? []).map((path) => path.backend)),
    ];

    const services = backends.flatMap((backend) =>
      backend?.service?.name ? [{ from, to: nodeKey("Service", namespace, backend.service.name) }] : [],
    );

    const tlsSecrets = (ingress.spec?.tls ?? []).flatMap((tls) =>
      tls.secretName ? [{ from, to: nodeKey("Secret", namespace, tls.secretName) }] : [],
    );

    return [...services, ...tlsSecrets];
  });

  return { edges };
};
