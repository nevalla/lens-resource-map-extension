import "./KubeResourceChart.scss"
import * as React from "react";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4plugins_forceDirected from "@amcharts/amcharts4/plugins/forceDirected";

import am4themes_dark from "@amcharts/amcharts4/themes/dark";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import { Component, K8sApi } from "@k8slens/extensions";
import { observer } from "mobx-react";
import { observable } from "mobx";

am4core.useTheme(am4themes_dark);
am4core.useTheme(am4themes_animated);

@observer
export class KubeResourceChart extends React.Component<{ id?: string }> {
  @observable static isReady = false;

  protected htmlId = this.props.id || "resource-map";
  protected chart: am4plugins_forceDirected.ForceDirectedTree;
  protected secretsData: any = [];
  protected helmData: any = [];

  protected namespaceStore = K8sApi.apiManager.getStore(K8sApi.namespacesApi) as K8sApi.NamespaceStore;
  protected podsStore = K8sApi.apiManager.getStore(K8sApi.podsApi) as K8sApi.PodsStore;
  protected deploymentStore = K8sApi.apiManager.getStore(K8sApi.deploymentApi) as K8sApi.DeploymentStore;
  protected statefulsetStore = K8sApi.apiManager.getStore(K8sApi.statefulSetApi) as K8sApi.StatefulSetStore;
  protected daemonsetStore = K8sApi.apiManager.getStore(K8sApi.daemonSetApi) as K8sApi.DaemonSetStore;
  protected secretStore = K8sApi.apiManager.getStore(K8sApi.secretsApi) as K8sApi.SecretsStore;
  protected serviceStore = K8sApi.apiManager.getStore(K8sApi.serviceApi) as K8sApi.ServiceStore;

  protected colors = {
    namespace: "#3d90ce",
    deployment: "#6771dc",
    daemonset: "#a367dc",
    statefulset: "#dc67ce",
    service: "#808af5",
    secret: "#dc8c67",
    pod: "#80f58e",
    container: "#8cdcff",
    helm: "#0f1689",
  };

  async componentDidMount() {
    try {
      await this.loadData();
      this.createChart();
    } catch (err) {
      console.error("Oops, something went wrong", err);
    }
  }

  componentWillUnmount() {
    this.destroyChart();
  }

  protected async loadData() {
    if (KubeResourceChart.isReady) {
      return; // already loaded
    }
    await Promise.all([
      this.namespaceStore.loadAll(),
      this.secretStore.loadAll(),
      this.serviceStore.loadAll(),
      this.deploymentStore.loadAll(),
      this.daemonsetStore.loadAll(),
      this.podsStore.loadAll(),
      this.statefulsetStore.loadAll(),
    ]);
    KubeResourceChart.isReady = true;
  }

  protected destroyChart() {
    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
  }

  getChartDataSeries() {
    const {
      namespaceStore, podsStore, serviceStore,
      deploymentStore, daemonsetStore, statefulsetStore,
    } = this;

    const namespacesData = namespaceStore.items.map((namespace: K8sApi.Namespace) => {
      return {
        id: `${namespace.kind}-${namespace.getName()}`,
        kind: namespace.kind,
        name: namespace.getName(),
        image: "https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/ns.svg",
        value: 25,
        color: this.colors.namespace,
      }
    });

    const serviceData = serviceStore.items.map((service: K8sApi.Service) => {
      const selector = service.spec.selector;
      let podLinks: string[] = []
      if (selector) {
        const pods = podsStore.items.filter((item: K8sApi.Pod) => {
          const itemLabels = item.metadata.labels || {};
          let matches = item.getNs() == service.getNs()
          if (matches) {
            matches = Object.entries(selector)
              .every(([key, value]) => {
                return itemLabels[key] === value
              });
          }
          return matches
        });
        podLinks = pods.map((pod: K8sApi.Pod) => `${pod.kind}-${pod.getName()}`)
      }
      return {
        id: `${service.kind}-${service.getName()}`,
        kind: service.kind,
        name: service.getName(),
        namespace: service.getNs(),
        image: "https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/svc.svg",
        value: 40,
        color: this.colors.service,
        links: podLinks
      };
    })

    const deploymentData = deploymentStore.items.map((deployment: K8sApi.Deployment) => {
      const pods = deploymentStore.getChildPods(deployment)
      return this.getControllerChartNode(deployment, "https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/deploy.svg", pods)
    });

    const statefulsetData = statefulsetStore.items.map((statefulset: K8sApi.StatefulSet) => {
      const pods = statefulsetStore.getChildPods(statefulset)
      return this.getControllerChartNode(statefulset, "https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/sts.svg", pods)
    });

    const daemonsetData = daemonsetStore.items.map((daemonset: K8sApi.DaemonSet) => {
      const pods = daemonsetStore.getChildPods(daemonset)
      return this.getControllerChartNode(daemonset, "https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/ds.svg", pods)
    });

    return [
      namespacesData,
      deploymentData,
      this.secretsData,
      statefulsetData,
      daemonsetData,
      serviceData,
      this.helmData,
    ].flat()
  }

  protected createChart() {
    if (this.chart) {
      this.destroyChart();
    }

    // Create chart
    const chart = am4core.create(this.htmlId, am4plugins_forceDirected.ForceDirectedTree);

    chart.zoomable = true;
    // Create series
    const series = chart.series.push(new am4plugins_forceDirected.ForceDirectedSeries());

    // Set data
    series.data = this.getChartDataSeries();

    // Set up data fields
    series.dataFields.value = "value";
    series.dataFields.name = "name";
    series.dataFields.id = "id";
    series.dataFields.linkWith = "links";
    series.dataFields.children = "children";
    series.dataFields.color = "color";

    series.fontSize = 10;
    //series.minRadius = 15;
    series.maxRadius = am4core.percent(2);
    series.maxRadius = am4core.percent(4);
    series.links.template.strokeWidth = 2;
    //series.nodes.template.label.hideOversized = true;
    //series.nodes.template.label.truncate = true;
    series.links.template.distance = 1.5;
    series.nodes.template.tooltipText = `
[bold]{name}[/]
---
[bold]kind:[/] {kind}
[bold]namespace:[/] {namespace}
`;
    series.nodes.template.fillOpacity = 1;

    // Add labels
    series.nodes.template.label.text = "{name}";
    series.nodes.template.label.valign = "bottom";
    series.nodes.template.label.fill = am4core.color("#FFF");
    series.nodes.template.label.dy = 5;

    // Configure icons
    const icon = series.nodes.template.createChild(am4core.Image);
    icon.propertyFields.href = "image";
    icon.horizontalCenter = "middle";
    icon.verticalCenter = "middle";

    series.maxLevels = 3;
    series.manyBodyStrength = -16;

    this.chart = chart;
  }

  getControllerChartNode(controller: K8sApi.KubeObject, image: string, pods: K8sApi.Pod[]) {
    const helmLinks: string[] = []
    if (controller.metadata?.labels?.heritage === "Helm" && controller.metadata?.labels?.release) {
      const releaseName = controller.metadata.labels.release
      if (!this.helmData.find((item: any) => {
        return item.name == releaseName && item.namespace == controller.getNs()
      })) {
        this.helmData.push(this.getHelmReleaseCartNode(releaseName, controller.getNs()))
      }
      helmLinks.push(`HelmRelease-${releaseName}`)
    }
    return {
      id: `${controller.kind}-${controller.getName()}`,
      name: controller.getName(),
      kind: controller.kind,
      namespace: controller.getNs(),
      value: 60,
      color: this.colors[controller.kind.toLowerCase() as "pod"],
      image: image,
      children: pods ? this.getChildrenPodsNodes(pods) : [],
      links: helmLinks
    }
  }

  getHelmReleaseCartNode(name: string, namespace: string): any {
    return {
      id: `HelmRelease-${name}`,
      name: name,
      namespace: namespace,
      kind: "HelmRelease",
      image: "https://cncf-branding.netlify.app/img/projects/helm/icon/white/helm-icon-white.svg",
      value: 40,
      color: this.colors.helm,
    }
  }

  getChildrenPodsNodes(pods: K8sApi.Pod[]): any {
    return pods.map((pod) => {

      const secretLinks: string[] = [];
      pod.getSecrets().forEach((secretName) => {
        const secret: K8sApi.Secret = this.secretStore.items.find((item: K8sApi.Secret) => item.getName() == secretName && item.getNs() == pod.getNs());
        if (secret) {
          const dataItem = {
            id: `${secret.kind}-${secret.getName()}`,
            kind: secret.kind,
            namespace: pod.getNs(),
            name: secret.getName(),
            value: 40,
            color: this.colors.secret,
            image: "https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/secret.svg"
          }
          secretLinks.push(dataItem.id)
          if (!this.secretsData.find((item: any) => {
            return item.id === dataItem.id
          })) {
            this.secretsData.push(dataItem);
          }
        }
      })
      return {
        id: `${pod.kind}-${pod.getName()}`,
        name: pod.getName(),
        namespace: pod.getNs(),
        kind: pod.kind,
        image: "https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/pod.svg",
        value: 40,
        links: secretLinks,
        color: this.colors.pod,
        children: pod.getContainers().map(container => {
          const secretLinks: string[] = []
          container.env?.forEach((env) => {
            const secretName = env.valueFrom?.secretKeyRef?.name;
            if (secretName) {
              const secret: K8sApi.Secret = this.secretStore.items.find((item: K8sApi.Secret) => item.getName() == secretName && item.getNs() == pod.getNs());
              if (secret) {
                const dataItem = {
                  id: `${secret.kind}-${secret.getName()}`,
                  kind: secret.kind,
                  namespace: pod.getNs(),
                  name: secret.getName(),
                  value: 40,
                  color: this.colors.secret,
                  image: "https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/secret.svg"
                }
                secretLinks.push(dataItem.id)
                if (!this.secretsData.find((item: any) => {
                  return item.id === dataItem.id
                })) {
                  this.secretsData.push(dataItem);
                }
              }
            }
          })
          return {
            id: `${pod.kind}-${pod.getName()}-${container.name}`,
            kind: "Container",
            namespace: pod.getNs(),
            name: container.name,
            image: "https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/pod.svg",
            value: 20,
            color: this.colors.container,
            links: secretLinks
          }
        })
      }
    })
  }

  render() {
    return (
      <div id={this.htmlId} className="KubeResourceChart flex center">
        {!KubeResourceChart.isReady && <Component.Spinner/>}
      </div>
    );
  }
}
