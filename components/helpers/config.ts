type ConfigItem = {
  color?: string;
  icon?: string;
  size?: number;
  img?: HTMLImageElement;
  tooltipClass?: any;
}

type Config = {
  [key:string]: ConfigItem;
}

export const config: Config = {
  deployment: {
    color: "#6771dc",
    icon: "https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/deploy.svg",
    size: 25,
  },
  daemonset: {
    color: "#a367dc",
    icon: "https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/ds.svg",
    size: 25,
  },
  statefulset: {
    color: "#dc67ce",
    icon: "https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/sts.svg",
    size: 25,
  },
  service: {
    color: "#808af5",
    icon: "https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/svc.svg",
    size: 20,
  },
  secret: {
    color: "#ff9933",
    icon: "https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/secret.svg",
    size: 20,
  },
  configmap: {
    color: "#ff9933",
    icon: "https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/cm.svg",
    size: 20,
  },
  pod: {
    color: "#80f58e",
    icon: "https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/pod.svg",
    size: 20,
  },
  ingress: {
    color: "#67dcbb",
    icon: "https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/ing.svg",
    size: 20,
  },
  helmrelease: {
    color: "#0f1689",
    icon: "https://raw.githubusercontent.com/cncf/artwork/main/projects/helm/icon/white/helm-icon-white.svg",
    size: 30,
  },
  persistentvolumeclaim: {
    color: "#cdff93",
    icon: "https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/pvc.svg",
    size: 20,
  }
}
