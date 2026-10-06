import { dropDownMenu } from "@k8slens/drop-down-menu-contracts";
import { Div, Span } from "@k8slens/element-components";
import { FilterListIcon } from "@k8slens/icon";
import { PlainButton } from "@k8slens/input-components";
import { useInject, useSyncInject } from "@k8slens/use-inject";
import type { IComputedValue } from "mobx";
import { observer } from "mobx-react";
import type { LoadedSnapshot } from "../cluster-snapshot.injectable";
import { openResourceInjectable } from "../open-resource.injectable";
import { resourceMapInjectable } from "../resource-graph.injectable";
import { ForceGraph } from "./ForceGraph";
import { namespaceMenuKind } from "./namespace-menu.injectable";
import { SnapshotLoader } from "./SnapshotLoader";

export const ResourceMap = ({ clusterId }: { clusterId: string }) => (
  <Div $flex={{ direction: "vertical" }} $size="full">
    <SnapshotLoader clusterId={clusterId}>{(loaded) => <LoadedResourceMap clusterId={clusterId} loaded={loaded} />}</SnapshotLoader>
  </Div>
);

const LoadedResourceMap = observer(({ clusterId, loaded }: { clusterId: string; loaded: IComputedValue<LoadedSnapshot> }) => {
  const resourceMap = useSyncInject(resourceMapInjectable, clusterId, loaded);
  const openResource = useInject(openResourceInjectable)();
  const selected = resourceMap.namespaceFilter.selected.get();
  const { unavailableKinds } = loaded.get();

  return (
    <>
      <Div $flex={{ gap: "m", verticalAlign: "center" }} $padding={{ horizontal: "m", vertical: "s" }}>
        <Span $font={{ size: "xl", bold: true }}>Resource Map</Span>
        <PlainButton
          Icon={FilterListIcon}
          $dropDownMenu={dropDownMenu(namespaceMenuKind, { data: { clusterId, namespaces: resourceMap.namespaces.get() } })}
        >
          {selected.length === 0 ? "All namespaces" : `Namespaces: ${selected.join(", ")}`}
        </PlainButton>
        {unavailableKinds.length > 0 && (
          <Span $color="warning" $tooltip="You may not list these kinds in this cluster, so they are not drawn.">
            Not shown: {unavailableKinds.join(", ")}
          </Span>
        )}
      </Div>
      <Div $flexChild $relative>
        <ForceGraph
          graph={resourceMap.graph.get()}
          fitKey={selected.join(",")}
          onNodeClick={(node) => openResource(clusterId, node)}
        />
      </Div>
    </>
  );
});
