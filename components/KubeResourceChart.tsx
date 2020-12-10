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

// todo: inherit from @amcharts/* types if exists
export interface ChartDataSeries {
  id: string;
  name: string
  image: string
  value: number
  color?: string
  links?: string[]
  tooltipHTML: string;
  children?: ChartDataSeries[]
}

@observer
export class KubeResourceChart extends React.Component<{ id?: string }> {
  @observable static isReady = false;

  static colors = {
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

  static icons = {
    helm: "https://cncf-branding.netlify.app/img/projects/helm/icon/white/helm-icon-white.svg",
    namespace: "https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/ns.svg",
    pod: "https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/pod.svg",
    service: "https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/svc.svg",
    pvc: "https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/pvc.svg",
    ingress: "https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/ing.svg",
    deployment: "https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/deploy.svg",
    statefulset: "https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/sts.svg",
    daemonset: "https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/ds.svg",
    secret: "https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/secret.svg",
  }

  protected htmlId = this.props.id || "resource-map";
  protected icons = KubeResourceChart.icons
  protected colors = KubeResourceChart.colors
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
  protected pvcStore = K8sApi.apiManager.getStore(K8sApi.pvcApi) as K8sApi.VolumeClaimStore;
  protected ingressStore = K8sApi.apiManager.getStore(K8sApi.ingressApi) as K8sApi.IngressStore;

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
    if (KubeResourceChart.isReady) return;

    await Promise.all([
      this.namespaceStore.loadAll(),
      this.secretStore.loadAll(),
      this.serviceStore.loadAll(),
      this.deploymentStore.loadAll(),
      this.daemonsetStore.loadAll(),
      this.podsStore.loadAll(),
      this.statefulsetStore.loadAll(),
      this.pvcStore.loadAll(),
      this.ingressStore.loadAll()
    ]);
    KubeResourceChart.isReady = true;
  }

  protected destroyChart() {
    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
  }

  getTooltipTemplate<O extends K8sApi.KubeObject>(obj: O, customize?: (entries: string[][], obj: O) => string[][]): string {
    let entries: string[][] = [
      [obj.kind, obj.getName()],
    ];
    const namespace = obj.getNs();
    if (namespace) {
      entries.push(["Namespace", namespace]);
    }
    if (customize) {
      entries = customize(entries, obj);
    }
    return (
      `<div class="KubeResourceChartTooltip flex column gaps">
        ${entries.map(([name, value]) => `
          <p>
            <b>${name}</b>: <em>${value}</em>
          </p>
        `).join("")}
      </div>`
    )
  }

  getChartDataSeries(): ChartDataSeries[] {
    const {
      namespaceStore, podsStore, serviceStore,
      deploymentStore, daemonsetStore, statefulsetStore,
      ingressStore, pvcStore,
    } = this;

    const namespacesData: ChartDataSeries[] = namespaceStore.items.map((namespace: K8sApi.Namespace) => {
      return {
        id: `${namespace.kind}-${namespace.getName()}`,
        kind: namespace.kind,
        name: namespace.getName(),
        image: KubeResourceChart.icons.namespace,
        value: 25,
        color: this.colors.namespace,
        tooltipHTML: this.getTooltipTemplate(namespace),
      }
    });

    const serviceData: ChartDataSeries[] = serviceStore.items.map((service: K8sApi.Service) => {
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
        image: this.icons.service,
        value: 40,
        color: this.colors.service,
        links: podLinks,
        tooltipHTML: this.getTooltipTemplate(service),
      };
    })

    const pvcData: ChartDataSeries[] = pvcStore.items.map((pvc: K8sApi.PersistentVolumeClaim) => {
      return {
        id: `${pvc.kind}-${pvc.getName()}`,
        kind: pvc.kind,
        name: pvc.getName(),
        namespace: pvc.getNs(),
        image: this.icons.pvc,
        value: 40,
        tooltipHTML: this.getTooltipTemplate(pvc),
      }
    })

    const ingressData: ChartDataSeries[] = ingressStore.items.map((ingress: K8sApi.Ingress) => {
      const secretLinks: string[] = []
      const serviceLinks: string[] = []
      ingress.spec.tls?.filter(tls => tls.secretName).forEach((tls) => {
        const secretNode = this.getSecretChartNode(tls.secretName, ingress.getNs())
        if (secretNode) {
          secretLinks.push(secretNode.id)
        }
      })
      ingress.spec.rules.forEach((rule) => {
        rule.http.paths.forEach((path) => {
          const serviceName = (path.backend as any).serviceName
          if (serviceName) {
            const service = this.serviceStore.getByName(serviceName, ingress.getNs())
            if (service) {
              serviceLinks.push(`${service.kind}-${service.getName()}`)
            }
          }
        })
      })
      return {
        id: `${ingress.kind}-${ingress.getName()}`,
        kind: ingress.kind,
        name: ingress.getName(),
        namespace: ingress.getNs(),
        image: this.icons.ingress,
        value: 40,
        links: secretLinks.concat(serviceLinks),
        tooltipHTML: this.getTooltipTemplate(ingress),
      }
    })

    const deploymentData: ChartDataSeries[] = deploymentStore.items.map((deployment: K8sApi.Deployment) => {
      const pods = deploymentStore.getChildPods(deployment)
      return this.getControllerChartNode(deployment, this.icons.deployment, pods)
    });

    const statefulsetData: ChartDataSeries[] = statefulsetStore.items.map((statefulset: K8sApi.StatefulSet) => {
      const pods = statefulsetStore.getChildPods(statefulset)
      return this.getControllerChartNode(statefulset, this.icons.statefulset, pods)
    });

    const daemonsetData: ChartDataSeries[] = daemonsetStore.items.map((daemonset: K8sApi.DaemonSet) => {
      const pods = daemonsetStore.getChildPods(daemonset)
      return this.getControllerChartNode(daemonset, this.icons.daemonset, pods)
    });

    return [
      namespacesData,
      deploymentData,
      this.secretsData,
      statefulsetData,
      daemonsetData,
      serviceData,
      this.helmData,
      pvcData,
      ingressData
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
    series.nodes.template.togglable = true;
    series.nodes.template.tooltipHTML = "{tooltipHTML}"

    series.nodes.template.fillOpacity = 1;
    series.nodes.template.expandAll = false;

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

  getControllerChartNode(helmRelease: K8sApi.KubeObject, image: string, pods: K8sApi.Pod[]): ChartDataSeries {
    const links: string[] = [] // [`Namespace-${controller.getNs()}`]
    if (helmRelease.metadata?.labels?.heritage === "Helm" && helmRelease.metadata?.labels?.release) {
      const releaseName = helmRelease.metadata.labels.release
      if (!this.helmData.find((item: any) => {
        return item.name == releaseName && item.namespace == helmRelease.getNs()
      })) {
        this.helmData.push(this.getHelmReleaseChartNode(releaseName, helmRelease))
      }
      links.push(`HelmRelease-${releaseName}`)
    }
    return {
      id: `${helmRelease.kind}-${helmRelease.getName()}`,
      name: helmRelease.getName(),
      value: 60,
      color: this.colors[helmRelease.kind.toLowerCase() as "pod"],
      image: image,
      children: pods ? this.getChildrenPodsNodes(pods) : [],
      links: links,
      tooltipHTML: this.getTooltipTemplate(helmRelease),
    }
  }

  getHelmReleaseChartNode(name: string, release: K8sApi.KubeObject): ChartDataSeries {
    return {
      id: `HelmRelease-${name}`,
      name: name,
      image: this.icons.helm,
      value: 40,
      color: this.colors.helm,
      links: [`Namespace-${release.getNs()}`],
      tooltipHTML: this.getTooltipTemplate(release),
    }
  }

  getSecretChartNode(name: string, namespace: string): ChartDataSeries {
    const secret: K8sApi.Secret = this.secretStore.getByName(name, namespace);
    if (secret) {
      const id = `${secret.kind}-${secret.getName()}`
      const existingSecretNode = this.secretsData.find((item: any) => {
        return item.id === id
      });

      if (existingSecretNode) {
        return existingSecretNode;
      }

      const dataItem: ChartDataSeries = {
        id: id,
        name: secret.getName(),
        value: 40,
        color: this.colors.secret,
        image: this.icons.secret,
        tooltipHTML: this.getTooltipTemplate(secret),
      }

      this.secretsData.push(dataItem);
      return dataItem;
    }
  }

  getChildrenPodsNodes(pods: K8sApi.Pod[]): ChartDataSeries[] {
    return pods.map((pod) => {
      const secretLinks: string[] = [];
      const pvcLinks: string[] = [];
      pod.getVolumes().filter(volume => volume.persistentVolumeClaim?.claimName).forEach((volume) => {
        const volumeClaim = this.pvcStore.getByName(volume.persistentVolumeClaim.claimName, pod.getNs())
        if (volumeClaim) {
          pvcLinks.push(`${volumeClaim.kind}-${volumeClaim.getName()}`);
        }
      })
      pod.getSecrets().forEach((secretName) => {
        const dataItem = this.getSecretChartNode(secretName, pod.getNs());
        if (dataItem) {
          secretLinks.push(dataItem.id)
        }
      })
      return {
        id: `${pod.kind}-${pod.getName()}`,
        name: pod.getName(),
        kind: pod.kind,
        image: this.icons.pod,
        value: 40,
        links: [secretLinks, pvcLinks].flat(),
        color: this.colors.pod,
        tooltipHTML: this.getTooltipTemplate(pod),
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
                  name: secret.getName(),
                  value: 40,
                  color: this.colors.secret,
                  image: this.icons.secret,
                  tooltip: this.getTooltipTemplate(secret),
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
            name: container.name,
            image: this.icons.pod,
            value: 20,
            color: this.colors.container,
            links: secretLinks,
            tooltipHTML: this.getTooltipTemplate(pod),
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
