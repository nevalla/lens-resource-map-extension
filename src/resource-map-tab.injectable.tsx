import { clusterNameReactiveInjectionToken } from "@k8slens/cluster-contracts";
import { Div, Span } from "@k8slens/element-components";
import { getInjectable2 } from "@k8slens/injectable";
import { mainViewTabHostKind } from "@k8slens/main-view-contracts";
import {
  focusTabInjectionToken,
  getTabKind,
  getTabKindInjectableBunch,
  openTabInjectionToken,
  tabIsOpenInjectionToken,
  type TabProps,
} from "@k8slens/tab-contracts";
import { useSyncInject } from "@k8slens/use-inject";
import { observer } from "mobx-react";
import { promiseState } from "./promise-state";
import { ResourceMap } from "./ui/ResourceMap";
import { ResourceMapIcon } from "./ui/ResourceMapIcon";

// One tab per cluster, opened by the cluster's id.
export const resourceMapTabKind = getTabKind()("resource-map");

const ResourceMapTitle = observer(({ tabId: clusterId }: TabProps<typeof mainViewTabHostKind>) => {
  const clusterName = promiseState(useSyncInject(clusterNameReactiveInjectionToken, clusterId));

  return (
    <Div $flex={{ gap: "xs", verticalAlign: "center" }}>
      <ResourceMapIcon $size="m" />
      <Span>Resource Map{clusterName.status === "fulfilled" && `: ${clusterName.value.get()}`}</Span>
    </Div>
  );
});

const ResourceMapTab = ({ tabId: clusterId }: TabProps<typeof mainViewTabHostKind>) => <ResourceMap clusterId={clusterId} />;

export const resourceMapTabBunch = getTabKindInjectableBunch({
  tabHostKind: mainViewTabHostKind,
  kind: resourceMapTabKind,
  Component: ResourceMapTab,
  Title: ResourceMapTitle,
});

export const showResourceMapInjectable = getInjectable2({
  id: "kube-resource-map-show-resource-map",
  consumptions: [openTabInjectionToken, focusTabInjectionToken, tabIsOpenInjectionToken],

  instantiate: (di) => {
    const openTab = di.inject(openTabInjectionToken.for(mainViewTabHostKind).for(resourceMapTabKind).for(di.scopeIds))();
    const focusTab = di.inject(focusTabInjectionToken.for(mainViewTabHostKind).for(resourceMapTabKind).for(di.scopeIds))();
    const isOpen = di.inject(tabIsOpenInjectionToken.for(mainViewTabHostKind).for(resourceMapTabKind).for(di.scopeIds))();

    return () => async (clusterId: string) => {
      if (await isOpen({ tabId: clusterId })) {
        await focusTab({ tabId: clusterId });
      } else {
        await openTab({ tabId: clusterId });
      }
    };
  },
});
