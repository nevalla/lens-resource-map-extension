import { getInjectable2 } from "@k8slens/injectable";
import { getPersistableValueInjectableBunch } from "@k8slens/persistable-contracts";
import { computed, type IObservableValue, observable, runInAction } from "mobx";

// No namespaces picked means every namespace.
export const selectedNamespacesBunch = getPersistableValueInjectableBunch<readonly string[], [clusterId: string]>()({
  id: "kube-resource-map-selected-namespaces",
  defaultValue: { instantiate: () => async () => [] },
});

export const namespaceFilterInjectable = getInjectable2({
  id: "kube-resource-map-namespace-filter",

  // One instance per cluster: the factory's parameters key the instances.
  instantiate: (di) => {
    const getSelectedNamespaces = di.inject(selectedNamespacesBunch.persistable);

    return (clusterId: string) => {
      const persisted = observable.box<IObservableValue<readonly string[]> | undefined>(undefined, { deep: false });

      // Unread, the filter shows every namespace and keeps nothing.
      getSelectedNamespaces(clusterId).then(
        (box) => runInAction(() => persisted.set(box)),
        (error: unknown) => console.error("[kube-resource-map] could not read the namespace filter", error),
      );

      const selected = computed(() => persisted.get()?.get() ?? []);

      return {
        selected,

        toggle: (namespace: string) => {
          const box = persisted.get();
          const current = selected.get();

          box?.set(current.includes(namespace) ? current.filter((picked) => picked !== namespace) : [...current, namespace]);
        },

        clear: () => persisted.get()?.set([]),
      };
    };
  },
});
