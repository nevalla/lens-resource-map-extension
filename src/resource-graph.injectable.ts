import { getInjectable2 } from "@k8slens/injectable";
import { computed, type IComputedValue } from "mobx";
import type { LoadedSnapshot } from "./cluster-snapshot.injectable";
import { buildGraph } from "./graph/build-graph";
import { neighbourhood } from "./graph/neighbourhood";
import { relations } from "./graph/relations";
import { namespaceFilterInjectable } from "./namespace-filter.injectable";

// Every resource of the cluster and how they relate, whatever the namespace filter says.
export const clusterGraphInjectable = getInjectable2({
  id: "kube-resource-map-cluster-graph",
  // Keyed by snapshots, which are replaced each time a cluster's watch restarts.
  maxCacheSize: 8,
  instantiate: () => (loaded: IComputedValue<LoadedSnapshot>) =>
    computed(() => buildGraph(loaded.get().snapshot, relations, [])),
});

// The full map of a cluster, narrowed to the namespaces the user picked.
export const resourceMapInjectable = getInjectable2({
  id: "kube-resource-map-resource-map",
  maxCacheSize: 8,

  instantiate: (di) => {
    const namespaceFilterFor = di.inject(namespaceFilterInjectable);
    const clusterGraphFor = di.inject(clusterGraphInjectable);

    return (clusterId: string, loaded: IComputedValue<LoadedSnapshot>) => {
      const namespaceFilter = namespaceFilterFor(clusterId);
      const clusterGraph = clusterGraphFor(loaded);

      const namespaces = computed(() =>
        [...new Set([...clusterGraph.get().nodes.values()].flatMap((node) => (node.namespace ? [node.namespace] : [])))].sort(),
      );

      return {
        graph: computed(() => {
          const selected = namespaceFilter.selected.get();

          return selected.length === 0 ? clusterGraph.get() : buildGraph(loaded.get().snapshot, relations, selected);
        }),
        namespaces,
        namespaceFilter,
      };
    };
  },
});

// What one resource is connected to, for its details panel.
export const resourceNeighbourhoodInjectable = getInjectable2({
  id: "kube-resource-map-resource-neighbourhood",
  maxCacheSize: 32,

  instantiate: (di) => {
    const clusterGraphFor = di.inject(clusterGraphInjectable);

    return (loaded: IComputedValue<LoadedSnapshot>, key: string) => {
      const clusterGraph = clusterGraphFor(loaded);

      return computed(() => neighbourhood(clusterGraph.get(), key));
    };
  },
});
