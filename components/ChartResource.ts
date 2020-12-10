import { K8sApi } from "@k8slens/extensions";

export type ChartNode = {
  id: string;
  value?: number;
  color?: string;
  name: string;
  links: string[];
  children: ChartNode[];
}
export interface ChartResource {
  value?: number;
  color?: string;
  toChartNode(): ChartNode;
  getId(): string;
  getChildren(): ChartResource[];
  getParent(): ChartResource;
  getLinks(): ChartResource[];
}

export class ChartPod implements ChartResource {
  value: 80;
  color: "#8cdcff";
  pod: K8sApi.Pod;

  constructor(pod: K8sApi.Pod) {
    this.pod = pod;
  }

  getId(): string {
    return this.pod.getId()
  }

  getChildren(): ChartResource[] {
    this.pod.getSecrets().forEach((secretName) => {
      const secret: K8sApi.Secret = secretStore.items.find((item: K8sApi.Secret) => item.getName() == secretName && item.getNs() == pod.getNs());
      if (secret) {
        const dataItem = {
          id: `${secret.kind}-${secret.getName()}`,
          name: secret.getName(),
          value: 50,
          color: colors.secret
        }
        secretLinks.push(dataItem.id)
        secretsData.push(dataItem)
      }
    })
  }

  getParent(): ChartResource {
    return null;
  }

  getLinks(): ChartResource[] {
    return [];
  }

  toChartNode(): ChartNode {
    return {
      id: this.getId(),
      name: this.pod.getName(),
      value: this.value,
      children: this.getChildren().map(child => child.toChartNode()),
      links: this.getLinks().map(item => item.getId()),
    }
  }
}