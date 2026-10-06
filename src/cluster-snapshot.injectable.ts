import {
  appsV1,
  batchV1,
  configMapKind,
  coreV1,
  cronJobKind,
  daemonSetKind,
  deploymentKind,
  ingressKind,
  jobKind,
  type KubeResourceKind,
  kubeResourcesInjectionToken,
  type KubernetesApiVersion,
  networkingV1,
  persistentVolumeClaimKind,
  podKind,
  replicaSetKind,
  secretKind,
  serviceKind,
  statefulSetKind,
} from "@k8slens/kubernetes-contracts";
import { getSubscribableInjectableBunch, type Subscribable } from "@k8slens/subscribable";
import { computed, type IComputedValue, observable, runInAction } from "mobx";
import type { ClusterSnapshot, ServedResource, SnapshotKey } from "./graph/types";

const sources: Record<SnapshotKey, readonly [KubeResourceKind, KubernetesApiVersion]> = {
  pods: [podKind, coreV1],
  replicaSets: [replicaSetKind, appsV1],
  deployments: [deploymentKind, appsV1],
  statefulSets: [statefulSetKind, appsV1],
  daemonSets: [daemonSetKind, appsV1],
  jobs: [jobKind, batchV1],
  cronJobs: [cronJobKind, batchV1],
  services: [serviceKind, coreV1],
  ingresses: [ingressKind, networkingV1],
  configMaps: [configMapKind, coreV1],
  secrets: [secretKind, coreV1],
  persistentVolumeClaims: [persistentVolumeClaimKind, coreV1],
};

const snapshotKeys = Object.keys(sources) as SnapshotKey[];

export interface LoadedSnapshot {
  readonly snapshot: ClusterSnapshot;
  // Kinds that could not be listed, for RBAC say. They are drawn as if there were none.
  readonly unavailableKinds: readonly string[];
}

// Every kind the map draws, in every namespace, watched for as long as a map is shown.
export const clusterSnapshotBunch = getSubscribableInjectableBunch<LoadedSnapshot, [clusterId: string]>()({
  id: "kube-resource-map-cluster-snapshot",

  source: {
    consumptions: [kubeResourcesInjectionToken],

    instantiate: (di) => {
      const kubeResources = di.inject(kubeResourcesInjectionToken)();

      const subscribableOf = (key: SnapshotKey, clusterId: string) => {
        const [kind, apiVersion] = sources[key];

        return kubeResources(kind, apiVersion as never, clusterId) as Subscribable<readonly ServedResource[]>;
      };

      return () => (clusterId) => ({
        derive: () => {
          const subscriptions = snapshotKeys.map((key) => [key, subscribableOf(key, clusterId).subscribe()] as const);
          const loaded = observable.map<SnapshotKey, IComputedValue<readonly ServedResource[]>>({}, { deep: false });
          const unavailableKinds = observable.array<string>([], { deep: false });

          subscriptions.forEach(([, subscription]) => subscription.claim());

          const ready = Promise.all(
            subscriptions.map(async ([key, subscription]) => {
              try {
                const value = await subscription.value;

                runInAction(() => loaded.set(key, value));
              } catch {
                runInAction(() => unavailableKinds.push(sources[key][0]));
              }
            }),
          ).then(() => {
            if (unavailableKinds.length === snapshotKeys.length) {
              throw new Error("none of the resource kinds could be listed");
            }
          });

          const value = computed(
            (): LoadedSnapshot => ({
              snapshot: Object.fromEntries(snapshotKeys.map((key) => [key, loaded.get(key)?.get() ?? []])) as unknown as ClusterSnapshot,
              unavailableKinds: [...unavailableKinds],
            }),
          );

          return {
            value,
            ready,
            stop: () => subscriptions.forEach(([, subscription]) => subscription.dispose()),
          };
        },
      });
    },
  },
});
