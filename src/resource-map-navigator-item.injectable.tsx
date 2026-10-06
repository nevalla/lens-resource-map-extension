import { clusterNavigatorItemKind } from "@k8slens/cluster-contracts";
import { NavigatorItemIcon, NavigatorItemLabel, NavigatorLeafIndicator } from "@k8slens/navigator-components";
import { getNavigatorItemKind, getNavigatorItemKindInjectableBunch2 } from "@k8slens/navigator-contracts";
import { computed } from "mobx";
import { showResourceMapInjectable } from "./resource-map-tab.injectable";
import { ResourceMapIcon } from "./ui/ResourceMapIcon";

interface ResourceMapItem {
  readonly id: string;
  readonly name: string;
}

export const resourceMapNavigatorItemKind = getNavigatorItemKind<ResourceMapItem, [clusterId: string]>()("resource-map");

// No order number: an item with one lands above all of Lens's own items, whatever the number.
const resourceMapItem = computed((): ResourceMapItem[] => [{ id: "resource-map", name: "Resource Map" }]);

const ResourceMapRow = () => (
  <>
    <NavigatorLeafIndicator />
    <NavigatorItemIcon>
      <ResourceMapIcon />
    </NavigatorItemIcon>
    <NavigatorItemLabel>Resource Map</NavigatorItemLabel>
  </>
);

export const resourceMapNavigatorItemBunch = getNavigatorItemKindInjectableBunch2({
  kind: resourceMapNavigatorItemKind,
  parentKind: clusterNavigatorItemKind,
  description: "Opens the map of a cluster's resources and how they relate.",

  items: {
    instantiate: () => async () => resourceMapItem,
  },

  activate: {
    instantiate: (di) => {
      const showResourceMap = di.inject(showResourceMapInjectable)();

      return (clusterId) => showResourceMap(clusterId);
    },
  },

  Component: ResourceMapRow,
});
