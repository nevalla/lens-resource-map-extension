import { getDropDownMenuItemInjectableBunch, getDropDownMenuKind } from "@k8slens/drop-down-menu-contracts";
import { Div } from "@k8slens/element-components";
import { MultiSelect } from "@k8slens/input-components";
import { useSyncInject } from "@k8slens/use-inject";
import { observer } from "mobx-react";
import { namespaceFilterInjectable } from "../namespace-filter.injectable";

export interface NamespaceMenuData {
  readonly clusterId: string;
  readonly namespaces: readonly string[];
}

export const namespaceMenuKind = getDropDownMenuKind<NamespaceMenuData>()("kube-resource-map-namespace-menu");

// Not a namespace name Kubernetes allows, so it cannot clash with one.
const allNamespaces = "*";

const NamespacePicker = observer(({ data }: { data: NamespaceMenuData }) => {
  const namespaceFilter = useSyncInject(namespaceFilterInjectable, data.clusterId);
  const selected = namespaceFilter.selected.get();

  const options = [
    { id: allNamespaces, label: "All namespaces" },
    // A picked namespace may be gone from the cluster, and still needs unpicking.
    ...[...new Set([...data.namespaces, ...selected])].sort().map((namespace) => ({ id: namespace, label: namespace })),
  ];

  return (
    <Div $padding="xs" $overflow="auto" $style={{ maxHeight: "60vh", minWidth: 240 }}>
      <MultiSelect
        options={options}
        selected={selected.length === 0 ? [allNamespaces] : selected}
        onToggle={(id) => (id === allNamespaces ? namespaceFilter.clear() : namespaceFilter.toggle(id))}
      />
    </Div>
  );
});

export const namespacePickerBunch = getDropDownMenuItemInjectableBunch({
  id: "kube-resource-map-namespace-picker",
  kind: namespaceMenuKind,
  orderNumber: 10,
  Component: NamespacePicker,
});
