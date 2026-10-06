import { buildDetailsPanelSectionBunch } from "@k8slens/details-panel-contracts";
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
  networkingV1,
  persistentVolumeClaimKind,
  podKind,
  secretKind,
  serviceKind,
  statefulSetKind,
} from "@k8slens/kubernetes-contracts";
import { ResourceMapSection } from "./ui/ResourceMapSection";

const section = { title: "Resource Map", orderNumber: 30, Component: ResourceMapSection };

export const deploymentSection = buildDetailsPanelSectionBunch({ id: "resource-map-deployment", kind: deploymentKind, apiVersion: appsV1, ...section });
export const statefulSetSection = buildDetailsPanelSectionBunch({ id: "resource-map-stateful-set", kind: statefulSetKind, apiVersion: appsV1, ...section });
export const daemonSetSection = buildDetailsPanelSectionBunch({ id: "resource-map-daemon-set", kind: daemonSetKind, apiVersion: appsV1, ...section });
export const jobSection = buildDetailsPanelSectionBunch({ id: "resource-map-job", kind: jobKind, apiVersion: batchV1, ...section });
export const cronJobSection = buildDetailsPanelSectionBunch({ id: "resource-map-cron-job", kind: cronJobKind, apiVersion: batchV1, ...section });
export const podSection = buildDetailsPanelSectionBunch({ id: "resource-map-pod", kind: podKind, apiVersion: coreV1, ...section });
export const serviceSection = buildDetailsPanelSectionBunch({ id: "resource-map-service", kind: serviceKind, apiVersion: coreV1, ...section });
export const ingressSection = buildDetailsPanelSectionBunch({ id: "resource-map-ingress", kind: ingressKind, apiVersion: networkingV1, ...section });
export const configMapSection = buildDetailsPanelSectionBunch({ id: "resource-map-config-map", kind: configMapKind, apiVersion: coreV1, ...section });
export const secretSection = buildDetailsPanelSectionBunch({ id: "resource-map-secret", kind: secretKind, apiVersion: coreV1, ...section });
export const persistentVolumeClaimSection = buildDetailsPanelSectionBunch({
  id: "resource-map-persistent-volume-claim",
  kind: persistentVolumeClaimKind,
  apiVersion: coreV1,
  ...section,
});
