import type { NodeStatus } from "../graph/types";
import configMapIcon from "../icons/cm.svg";
import cronJobIcon from "../icons/cronjob.svg";
import deploymentIcon from "../icons/deploy.svg";
import daemonSetIcon from "../icons/ds.svg";
import helmIcon from "../icons/helm.svg";
import ingressIcon from "../icons/ing.svg";
import jobIcon from "../icons/job.svg";
import podIcon from "../icons/pod.svg";
import persistentVolumeClaimIcon from "../icons/pvc.svg";
import replicaSetIcon from "../icons/rs.svg";
import secretIcon from "../icons/secret.svg";
import statefulSetIcon from "../icons/sts.svg";
import serviceIcon from "../icons/svc.svg";

export interface KindStyle {
  readonly color: string;
  readonly icon: string;
  readonly radius: number;
  // Workloads are drawn with a ring, so they stand out from what they run.
  readonly ringed: boolean;
}

const style = (color: string, icon: string, radius: number, ringed = false): KindStyle => ({ color, icon, radius, ringed });

export const kindStyles: Record<string, KindStyle> = {
  Deployment: style("#6771dc", deploymentIcon, 18, true),
  StatefulSet: style("#dc67ce", statefulSetIcon, 18, true),
  DaemonSet: style("#a367dc", daemonSetIcon, 18, true),
  ReplicaSet: style("#8067dc", replicaSetIcon, 16, true),
  CronJob: style("#c767dc", cronJobIcon, 18, true),
  Job: style("#b067dc", jobIcon, 16, true),
  Pod: style("#80f58e", podIcon, 14),
  Service: style("#808af5", serviceIcon, 14),
  Ingress: style("#67dcbb", ingressIcon, 14),
  ConfigMap: style("#ff9933", configMapIcon, 12),
  Secret: style("#ff9933", secretIcon, 12),
  PersistentVolumeClaim: style("#cdff93", persistentVolumeClaimIcon, 12),
  HelmRelease: style("#0f1689", helmIcon, 20),
};

export const statusColors: Record<NodeStatus, string> = {
  ok: "#4caf50",
  pending: "#ff9800",
  error: "#ce3933",
  terminated: "#9dabb5",
};

const images = new Map<string, HTMLImageElement>();

// Made on first draw rather than at import, so that importing needs no DOM.
export const iconImageOf = ({ icon }: KindStyle) => {
  let image = images.get(icon);

  if (!image) {
    image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(icon)}`;
    images.set(icon, image);
  }

  return image;
};
