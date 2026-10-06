import { Div, Span } from "@k8slens/element-components";
import { useInject, useSyncInject } from "@k8slens/use-inject";
import type { IComputedValue } from "mobx";
import { observer } from "mobx-react";
import type { LoadedSnapshot } from "../cluster-snapshot.injectable";
import { resourceKey } from "../graph/types";
import { openResourceInjectable } from "../open-resource.injectable";
import { resourceNeighbourhoodInjectable } from "../resource-graph.injectable";
import { ForceGraph } from "./ForceGraph";
import { SnapshotLoader } from "./SnapshotLoader";

// Only what every kind's resource has, so one component serves every kind.
interface ResourceMapSectionProps {
  readonly resource: { readonly kind: string; readonly metadata: { readonly name: string; readonly namespace?: string } };
  readonly clusterId: string;
}

// What the resource of a details panel is connected to.
export const ResourceMapSection = ({ resource, clusterId }: ResourceMapSectionProps) => (
  <Div $flex={{ direction: "vertical" }} $style={{ height: 400 }}>
    <SnapshotLoader clusterId={clusterId}>
      {(loaded) => <Neighbourhood clusterId={clusterId} loaded={loaded} focusKey={resourceKey(resource)} />}
    </SnapshotLoader>
  </Div>
);

interface NeighbourhoodProps {
  readonly clusterId: string;
  readonly loaded: IComputedValue<LoadedSnapshot>;
  readonly focusKey: string;
}

const Neighbourhood = observer(({ clusterId, loaded, focusKey }: NeighbourhoodProps) => {
  const graph = useSyncInject(resourceNeighbourhoodInjectable, loaded, focusKey).get();
  const openResource = useInject(openResourceInjectable)();

  // Hidden on the map, such as a service account token, or connected to nothing.
  if (graph.nodes.size === 0) {
    return <Span $color="textMuted">Not on the resource map.</Span>;
  }

  return <ForceGraph graph={graph} focusKey={focusKey} fitKey={focusKey} onNodeClick={(node) => openResource(clusterId, node)} />;
});
