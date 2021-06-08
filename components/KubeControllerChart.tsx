import { Renderer } from "@k8slens/extensions";
import { observer } from "mobx-react";
import { KubeResourceChart } from "./KubeResourceChart";

@observer
export class KubeControllerChart extends KubeResourceChart {

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

    this.generateControllerNode(this.props.object);
    this.generateIngresses();

    if (nodes.length != this.nodes.length || links.length != this.links.length) { // TODO: Improve the logic
      this.updateState(this.nodes, this.links);
    }
  }
}
