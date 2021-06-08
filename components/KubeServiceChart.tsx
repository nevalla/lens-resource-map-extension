import { Renderer } from "@k8slens/extensions";
import { observer } from "mobx-react";
import { KubeResourceChart } from "./KubeResourceChart";

@observer
export class KubeServiceChart extends KubeResourceChart {

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

    //this.generateControllerNode();
    const { object: service } = this.props;
    const selector = (service as Renderer.K8sApi.Service).spec.selector;

    this.generateNode(service);

    if (selector) {
        this.podsStore.getAllByNs(service.getNs()).filter((item: Renderer.K8sApi.Pod) => {
        const itemLabels = item.metadata.labels || {};
        return Object.entries(selector)
          .every(([key, value]) => {
            return itemLabels[key] === value
          });
      }).forEach((pod) => this.generatePodNode(pod));
    }

    this.generateIngresses();

    if (nodes.length != this.nodes.length || links.length != this.links.length) { // TODO: Improve the logic
      this.updateState(this.nodes, this.links);
    }
  }

  protected generateIngresses() {
    const { ingressStore } = this;
    const { object: service} = this.props;


    ingressStore.getAllByNs(service.getNs()).forEach((ingress: Renderer.K8sApi.Ingress) => {

      ingress.spec.rules.forEach((rule) => {
        rule.http.paths.forEach((path) => {
          if((path.backend as any).serviceName == service.getName() || (path.backend as any).service.name == service.getName()) {
            const serviceNode = this.generateNode(service);
            const ingressNode = this.getIngressNode(ingress);
            this.addLink({ source: ingressNode.id, target: serviceNode.id });
          }
        })
      })
    })
  }

  protected generatePodNode(pod: Renderer.K8sApi.Pod) {
    this.getPodNode(pod, false);
    this.generateServices([pod]);

    const controller = this.getControllerObject(pod);

    if (controller) {
      this.getControllerChartNode(controller, [pod], false);
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
