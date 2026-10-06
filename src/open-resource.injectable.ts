import { navigateToKubeResourceDetailsInjectionToken } from "@k8slens/details-panel-contracts";
import { getInjectable2 } from "@k8slens/injectable";
import { getKubeResourceKind, getKubernetesApiVersion } from "@k8slens/kubernetes-contracts";
import { isNavigationSupersededError } from "@k8slens/navigation-contracts";
import { showErrorNotificationInjectionToken } from "@k8slens/notifications-contracts";
import type { GraphNode } from "./graph/types";

// Opens the details of the resource a node stands for. Virtual nodes have nothing to open.
export const openResourceInjectable = getInjectable2({
  id: "kube-resource-map-open-resource",
  consumptions: [navigateToKubeResourceDetailsInjectionToken, showErrorNotificationInjectionToken],

  instantiate: (di) => {
    const navigateToKubeResourceDetails = di.inject(navigateToKubeResourceDetailsInjectionToken)();
    const showErrorNotification = di.inject(showErrorNotificationInjectionToken)();

    return () => async (clusterId: string, node: GraphNode) => {
      if (!node.resource) {
        return;
      }

      try {
        await navigateToKubeResourceDetails({
          clusterId,
          kind: getKubeResourceKind(node.kind),
          apiVersion: getKubernetesApiVersion(node.apiVersion),
          ref: { name: node.name, namespace: node.namespace },
        });
      } catch (error) {
        if (!isNavigationSupersededError(error)) {
          showErrorNotification(error instanceof Error ? error.message : String(error));
        }
      }
    };
  },
});
