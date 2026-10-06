import { Div, Span } from "@k8slens/element-components";
import { SpinnerIcon } from "@k8slens/icon";
import { useSubscribable } from "@k8slens/subscribable-react";
import { useSyncInject } from "@k8slens/use-inject";
import type { IComputedValue } from "mobx";
import { observer } from "mobx-react";
import type { ReactNode } from "react";
import { clusterSnapshotBunch, type LoadedSnapshot } from "../cluster-snapshot.injectable";
import { promiseState } from "../promise-state";

export interface SnapshotLoaderProps {
  readonly clusterId: string;
  readonly children: (loaded: IComputedValue<LoadedSnapshot>) => ReactNode;
}

// Keeps the cluster's resources watched while mounted, and renders once they have arrived.
export const SnapshotLoader = observer(({ clusterId, children }: SnapshotLoaderProps) => {
  const snapshot = useSyncInject(clusterSnapshotBunch.subscribable, clusterId);
  const { value } = useSubscribable(snapshot);
  const state = promiseState(value);

  switch (state.status) {
    case "pending":
      return (
        <Div $flex={{ gap: "s", verticalAlign: "center" }} $padding="m">
          <SpinnerIcon />
          <Span $color="textMuted">Loading resources…</Span>
        </Div>
      );
    case "rejected":
      return (
        <Span $color="critical" $padding="m">
          Could not load resources: {String(state.error)}
        </Span>
      );
    case "fulfilled":
      return children(state.value);
  }
});
