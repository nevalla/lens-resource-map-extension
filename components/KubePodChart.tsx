import { Renderer } from "@k8slens/extensions";
import { observer } from "mobx-react";
import { KubeResourceChart } from "./KubeResourceChart";

@observer
export class KubePodChart extends KubeResourceChart {

  registerStores() {
    this.kubeObjectStores = [
      this.podsStore,
      this.serviceStore,
      this.ingressStore,
      this.pvcStore,
      this.configMapStore,
      this.secretStore,
      this.deploymentStore,
      this.daemonsetStore,
      this.statefulsetStore
    ]
  }

  generateChartDataSeries = () => {
    const nodes = [...this.nodes];
    const links = [...this.links];

    this.generatePodNode();
    this.generateIngresses();

    if (nodes.length != this.nodes.length || links.length != this.links.length) { // TODO: Improve the logic
      this.updateState(this.nodes, this.links);
    }
  }

  protected generatePodNode() {
    const { object: pod } = this.props;

    this.getPodNode(pod as Renderer.K8sApi.Pod);
    this.generateServices([pod as Renderer.K8sApi.Pod]);

    const controller = this.getControllerObject(pod as Renderer.K8sApi.Pod);

    if (controller) {
      this.getControllerChartNode(controller, [pod as Renderer.K8sApi.Pod]);
    }
  }

  getControllerObject(pod: Renderer.K8sApi.Pod) {
    if (pod.getOwnerRefs()[0]?.kind == "StatefulSet") {
      return this.statefulsetStore.getByName(pod.getOwnerRefs()[0].name, pod.getNs());
    } else if(pod.getOwnerRefs()[0]?.kind == "DaemonSet") {
      return this.daemonsetStore.getByName(pod.getOwnerRefs()[0].name, pod.getNs());
    }
    return this.deploymentStore.items.find((deployment) =>
      deployment.getSelectors().every((label) => pod.getLabels().includes(label))
    )
  }
}
