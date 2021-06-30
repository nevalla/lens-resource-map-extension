import "./KubeForceChart.scss";
import { Common, Renderer } from "@k8slens/extensions";
import { comparer, observable, reaction, values } from "mobx";
import { disposeOnUnmount, observer } from "mobx-react";
import React, { createRef, Fragment, MutableRefObject } from "react";
import { ForceGraph2D} from 'react-force-graph';
import * as d3 from "d3-force";
import ReactDOM from "react-dom";
import { PodTooltip, ServiceTooltip, DeploymentTooltip, StatefulsetTooltip, DefaultTooltip, IngressTooltip} from "./tooltips";
import { config } from "./helpers/config";
import { ChartDataSeries, LinkObject, NodeObject } from "./helpers/types";
import { KubeObject } from "@k8slens/extensions/dist/src/renderer/api/kube-object";


const d33d = require("d3-force-3d");

export interface KubeResourceChartProps {
  id?: string; // html-id to bind chart
  object?: Renderer.K8sApi.KubeObject;
}

interface State {
  data: {
    nodes: ChartDataSeries[];
    links: LinkObject[];
  };
  highlightLinks?: Set<LinkObject>;
  hoverNode?: NodeObject;
}

@observer
export class KubeResourceChart extends React.Component<KubeResourceChartProps, State> {
  @observable static isReady = false;
  @observable isUnmounting = false;
  @observable data: State;

  static defaultProps: KubeResourceChartProps = {
    id: "kube-resource-map"
  }

  protected links: LinkObject[] = [];
  protected nodes: ChartDataSeries[] = [];
  protected highlightLinks: Set<LinkObject> = new Set<LinkObject>();
  protected initZoomDone = false;


  protected images: {[key: string]: HTMLImageElement; } = {}
  protected config = config;
  private chartRef: MutableRefObject<any>;
  protected secretsData: any = [];
  protected configMapsData: any = [];
  protected helmData: any = [];

  protected podsStore = Renderer.K8sApi.apiManager.getStore(Renderer.K8sApi.podsApi) as Renderer.K8sApi.PodsStore;
  protected deploymentStore = Renderer.K8sApi.apiManager.getStore(Renderer.K8sApi.deploymentApi) as Renderer.K8sApi.DeploymentStore;
  protected statefulsetStore = Renderer.K8sApi.apiManager.getStore(Renderer.K8sApi.statefulSetApi) as Renderer.K8sApi.StatefulSetStore;
  protected daemonsetStore = Renderer.K8sApi.apiManager.getStore(Renderer.K8sApi.daemonSetApi) as Renderer.K8sApi.DaemonSetStore;
  protected secretStore = Renderer.K8sApi.apiManager.getStore(Renderer.K8sApi.secretsApi) as Renderer.K8sApi.SecretsStore;
  protected serviceStore = Renderer.K8sApi.apiManager.getStore(Renderer.K8sApi.serviceApi) as Renderer.K8sApi.ServiceStore;
  protected pvcStore = Renderer.K8sApi.apiManager.getStore(Renderer.K8sApi.pvcApi) as Renderer.K8sApi.VolumeClaimStore;
  protected ingressStore =  Renderer.K8sApi.apiManager.getStore(Renderer.K8sApi.ingressApi) as Renderer.K8sApi.IngressStore;
  protected configMapStore = Renderer.K8sApi.apiManager.getStore(Renderer.K8sApi.configMapApi) as Renderer.K8sApi.ConfigMapsStore;

  protected kubeObjectStores: Renderer.K8sApi.KubeObjectStore[] = []
  private watchDisposers: Function[] = [];

  private disposers: Function[] = [];

  state: Readonly<State> = {
    data: {
      nodes: [],
      links: []
    },
    highlightLinks: new Set<LinkObject>()
  }

  constructor(props: KubeResourceChartProps) {
    super(props)
    this.chartRef = createRef();
    this.generateImages();
  }

  async componentDidMount() {
    this.setState(this.state);

    this.registerStores();

    await this.loadData();

    this.displayChart();

    const fg = this.chartRef.current;
    //fg?.zoom(1.2, 1000);
    fg?.d3Force('link').strength(2).distance(() => 60)
    fg?.d3Force('charge', d33d.forceManyBody().strength(-60).distanceMax(250));
    fg?.d3Force('collide', d3.forceCollide(40));
    fg?.d3Force("center", d3.forceCenter());

    const reactionOpts = {
      equals: comparer.structural,
    }

    const { object } = this.props
    const api = Renderer.K8sApi.apiManager.getApiByKind(object.kind, object.apiVersion);
    const store = Renderer.K8sApi.apiManager.getStore(api);


    this.disposers.push(reaction(() => this.props.object, (value, prev, _reaction) => { value.getId() !== prev.getId() ? this.displayChart() : this.refreshChart() }));
    this.disposers.push(reaction(() => this.podsStore.items.toJSON(), (values, previousValue, _reaction) => { this.refreshItems(values, previousValue) }, reactionOpts));
    this.disposers.push(reaction(() => store.items.toJSON(), (values, previousValue, _reaction) => { this.refreshItems(values, previousValue) }, reactionOpts));
  }

  registerStores() {
    const object = this.props.object;

    this.kubeObjectStores = [
      this.podsStore,
      this.serviceStore,
      this.ingressStore,
      this.pvcStore,
      this.configMapStore,
      this.secretStore,
    ]
    if (object instanceof Renderer.K8sApi.Deployment) {
      this.kubeObjectStores.push(this.deploymentStore);
    } else if (object instanceof Renderer.K8sApi.DaemonSet) {
      this.kubeObjectStores.push(this.daemonsetStore);
    } else if (object instanceof Renderer.K8sApi.StatefulSet) {
      this.kubeObjectStores.push(this.statefulsetStore);
    }
  }

  displayChart = () => {
    console.log("displayChart");
    this.initZoomDone = false;
    this.nodes = [];
    this.links = [];
    this.generateChartDataSeries();
  }

  refreshChart = () => {
    console.log("refreshChart");
    this.generateChartDataSeries();
  }

  getLinksForNode(node: ChartDataSeries): LinkObject[] {
    return this.links.filter((link) => link.source == node.id || link.target == node.id || (link.source as NodeObject).id == node.id || (link.target as NodeObject).id == node.id )
  }

  handleNodeHover(node: ChartDataSeries) {
    const highlightLinks = new Set<LinkObject>();
    const elem = document.getElementById(this.props.id);
    elem.style.cursor = node ? 'pointer' : null;
    if (node) {
      const links = this.getLinksForNode(node);
      links.forEach(link => highlightLinks.add(link));
    }
    this.setState({ highlightLinks, hoverNode: node})
  }

  generateImages() {
    Object.entries(this.config).forEach(value => {
      const img = new Image();
      img.src = value[1].icon;
      this.config[value[0]].img = img;
    })
  }

  componentWillUnmount() {
    this.isUnmounting = true;
    this.nodes = [];
    this.links = [];
    this.unsubscribeStores();

    this.disposers.forEach((disposer) => disposer())
  }

  protected refreshItems(newValues: any, previousValues: KubeObject[] = []) {
    const newItems = Array.from(newValues);
    const itemsToRemove = previousValues.filter((item) => !newItems.find((item2: Renderer.K8sApi.KubeObject) => item.getId() === item2.getId()));

    itemsToRemove.forEach((object) => {
      if (["DaemonSet", "StatefulSet", "Deployment"].includes(object.kind)) {
        const helmReleaseName = this.getHelmReleaseName(object)
        if (helmReleaseName) {
          const helmReleaseNode = this.getHelmReleaseChartNode(helmReleaseName, object.getNs())
          if (this.getLinksForNode(helmReleaseNode).length === 1) {
            this.deleteNode({ node: helmReleaseNode })
          }
        }
      }
      this.deleteNode({ object })
    })

    this.generateChartDataSeries();
  }

  protected unsubscribeStores() {
    this.watchDisposers.forEach(dispose => dispose());
    this.watchDisposers.length = 0;
  }

  protected async loadData() {
    this.unsubscribeStores();
    for (const store of this.kubeObjectStores) {
      try {
        if(!store.isLoaded) {
          await store.loadAll();
        }
        const unsuscribe = store.subscribe();
        this.watchDisposers.push(unsuscribe);
      } catch (error) {
        console.error("loading store error", error);
      }
    }
    KubeResourceChart.isReady = true;
  }

  generateChartDataSeries = () => {
    const nodes = [...this.nodes];
    const links = [...this.links];

    this.generateControllerNode(this.props.object);
    this.generateIngresses();

    if (nodes.length != this.nodes.length || links.length != this.links.length) { // TODO: Improve the logic
      console.log("updateState")
      this.updateState(this.nodes, this.links);
    }
  }

  protected updateState(nodes: ChartDataSeries[], links: LinkObject[]) {
    this.setState({
      data: {
        nodes: nodes,
        links: links,
      },
      highlightLinks: new Set<LinkObject>()
    })
  }

  protected generateControllerNode(object: KubeObject) {
    let pods: Renderer.K8sApi.Pod[] = [];
    if (object instanceof Renderer.K8sApi.Deployment) {
      pods = this.getDeploymentPods(object as Renderer.K8sApi.Deployment);
    } else if (object instanceof Renderer.K8sApi.DaemonSet) {
      pods = this.getDaemonSetPods(object);
    } else if (object instanceof Renderer.K8sApi.StatefulSet) {
      pods = this.getStatefulSetPods(object);
    }

    this.getControllerChartNode(object, pods);
    this.generateServices(pods);
  }

  protected getDeploymentPods(deployment: Renderer.K8sApi.Deployment) {
    const { deploymentStore } = this;

    return deploymentStore.getChildPods(deployment)
  }

  protected getDaemonSetPods(daemonset: Renderer.K8sApi.DaemonSet) {
    const { daemonsetStore } = this;

    return daemonsetStore.getChildPods(daemonset)
  }

  protected getStatefulSetPods(statefulset: Renderer.K8sApi.StatefulSet) {
    const { statefulsetStore } = this;

    return statefulsetStore.getChildPods(statefulset)
  }

  protected generateIngresses() {
    const { ingressStore } = this;
    const { namespace } = this.props.object.metadata;
    let ingressNode: ChartDataSeries;
    ingressStore.getAllByNs(namespace).forEach((ingress: Renderer.K8sApi.Ingress) => {

      ingress.spec.rules.forEach((rule) => {
        rule.http.paths.forEach((path) => {
          const serviceName = (path.backend as any).serviceName || (path.backend as any).service.name
          if (serviceName) {
            const serviceNode = this.nodes.filter(node => node.kind === "Service").find(node => node.object.getName() === serviceName);

            if (serviceNode) {
              if (!ingressNode) {
                ingressNode = this.getIngressNode(ingress);
              }
              this.addLink({ source: ingressNode.id, target: serviceNode.id });
            }
          }
        })
      })
    })
  }

  protected generateServices(deploymentPods: Renderer.K8sApi.Pod[]) {
    const { serviceStore} = this;
    const { namespace } = this.props.object.metadata;
    serviceStore.getAllByNs(namespace).forEach((service: Renderer.K8sApi.Service) => {
      const selector = service.spec.selector;
      if (selector) {
        const pods = deploymentPods.filter((item: Renderer.K8sApi.Pod) => {
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
        if (pods.length) {
          const serviceNode = this.generateNode(service);
          pods.forEach((pod: Renderer.K8sApi.Pod) => {
            const podNode = this.findNode(pod)
            if (podNode) {
              const serviceLink = { source: podNode.id, target: serviceNode.id}
              this.addLink(serviceLink);
            }
          })
        }
      }
    })

  }

  protected addLink(link: LinkObject) {
    const linkExists = this.findLink(link);

    if (!linkExists) {
      this.links.push(link);
    }
  }

  protected findLink(link: LinkObject) {
    return this.links.find(existingLink => (existingLink.source === link.source || (existingLink.source as NodeObject).id === link.source) && (existingLink.target === link.target || (existingLink.target as NodeObject).id === link.target))
  }
  protected findNode(object: Renderer.K8sApi.KubeObject) {
    if (!object) {
      return null;
    }

    return this.nodes.find(node => node.kind == object.kind && node.namespace && object.getNs() && node.name == object.getName())
  }

  protected deleteNode(opts: {node?: ChartDataSeries; object?: Renderer.K8sApi.KubeObject}) {
    const node = opts.node || this.findNode(opts.object);

    if(!node) {
      return;
    }

    this.getLinksForNode(node).forEach(link => {
      this.links.splice(this.links.indexOf(link), 1);
    })

    this.nodes.splice(this.nodes.indexOf(node), 1);
  }

  generateNode(object: Renderer.K8sApi.KubeObject): ChartDataSeries {
    const existingNode = this.findNode(object);

    if (existingNode) {
      return existingNode;
    }

    const id = `${object.kind}-${object.getName()}`
    const { color, img, size } = this.config[object.kind.toLowerCase()]

    const chartNode: ChartDataSeries = {
      id: id,
      object: object,
      kind: object.kind,
      name: object.getName(),
      namespace: object.getNs(),
      value: size,
      color: color,
      image: img,
      visible: true
    }

    this.nodes.push(chartNode)

    return chartNode;
  }

  getControllerChartNode(object: Renderer.K8sApi.KubeObject, pods: Renderer.K8sApi.Pod[], podLinks = true): ChartDataSeries {
    const controllerNode = this.generateNode(object);
    controllerNode.object = object;
    pods.forEach((pod: Renderer.K8sApi.Pod) => {
      const podNode = this.getPodNode(pod, podLinks);
      this.addLink({ source: controllerNode.id, target: podNode.id})
    })
    const releaseName = this.getHelmReleaseName(object);

    if (releaseName) {
      const release = this.getHelmReleaseChartNode(releaseName, object.getNs())
      this.addLink({target: release.id, source: controllerNode.id})
    }
    return controllerNode
  }

  getHelmReleaseName(object: Renderer.K8sApi.KubeObject): string {
    if (object.metadata?.labels?.heritage === "Helm" && object.metadata?.labels?.release) {
      return object.metadata.labels.release
    }
    if (object.metadata?.labels && object.metadata?.annotations && object.metadata?.labels["app.kubernetes.io/managed-by"] == "Helm" && object.metadata?.annotations["meta.helm.sh/release-name"]) {
      return object.metadata.annotations["meta.helm.sh/release-name"]
    }
    return null
  }

  getIngressNode(ingress: Renderer.K8sApi.Ingress) {
    const ingressNode = this.generateNode(ingress);

    ingress.spec.tls?.filter(tls => tls.secretName).forEach((tls) => {
      const secret = this.secretStore.getByName(tls.secretName, ingress.getNs());
      if (secret) {
        const secretNode = this.generateNode(secret)
        if (secretNode) {
          this.addLink({ source: ingressNode.id, target: secretNode.id })
        }
      }
    });

    return ingressNode
  }

  getPodNode(pod: Renderer.K8sApi.Pod, links = true): ChartDataSeries {
    const podNode = this.generateNode(pod);
    podNode.object = pod;
    if (["Running", "Succeeded"].includes(pod.getStatusMessage())) {
      podNode.color = "#4caf50";
    }
    else if (["Terminating", "Terminated", "Completed"].includes(pod.getStatusMessage())) {
      podNode.color = "#9dabb5";
    }
    else if (["Pending", "ContainerCreating"].includes(pod.getStatusMessage())) {
      podNode.color = "#2F4F4F" // #ff9800"
    }
    else if (["CrashLoopBackOff", "Failed", "Error"].includes(pod.getStatusMessage())) {
      podNode.color = "#ce3933"
    }

    if (!links) {
      return podNode;
    }

    pod.getContainers().forEach((container) => {
      container.env?.forEach((env) => {
        const secretName = env.valueFrom?.secretKeyRef?.name;
        if (secretName) {
          const secret = this.secretStore.getByName(secretName, pod.getNs());
          if (secret) {
            const secretNode = this.generateNode(secret)
            this.addLink({
              source: podNode.id, target: secretNode.id
            })
          }
        }
      })
      container.envFrom?.forEach((envFrom) => {
        const configMapName = envFrom.configMapRef?.name;
        if (configMapName) {
          const configMap = this.configMapStore.getByName(configMapName, pod.getNs());
          if (configMap) {
            const configMapNode = this.generateNode(configMap);
            this.addLink({
              source: podNode.id, target: configMapNode.id
            })
          }
        }

        const secretName = envFrom.secretRef?.name;
        if (secretName) {
          const secret = this.secretStore.getByName(secretName, pod.getNs());
          if (secret) {
            const secretNode = this.generateNode(secret);
            this.addLink({
              source: podNode.id, target: secretNode.id
            })
          }
        }
      })
    })


    pod.getVolumes().filter(volume => volume.persistentVolumeClaim?.claimName).forEach((volume) => {
      const volumeClaim = this.pvcStore.getByName(volume.persistentVolumeClaim.claimName, pod.getNs())
      if (volumeClaim) {
        const volumeClaimNode = this.generateNode(volumeClaim);

        if (volumeClaimNode) {
          this.addLink({ target: podNode.id, source: volumeClaimNode.id});
        }
      }
    })


    pod.getVolumes().filter(volume => volume.configMap?.name).forEach((volume) => {
      const configMap = this.configMapStore.getByName(volume.configMap.name, pod.getNs());
      if (configMap) {
        const dataItem = this.generateNode(configMap);
        if (dataItem) {
          this.addLink({target: podNode.id, source: dataItem.id});
        }
      }
    })

    pod.getSecrets().forEach((secretName) => {
      const secret = this.secretStore.getByName(secretName, pod.getNs());
      if (secret) {
        const dataItem = this.generateNode(secret)
        if (dataItem) {
          this.addLink({target: podNode.id, source: dataItem.id});
        }
      }
    })

    return podNode;
  }

  getHelmReleaseChartNode(name: string, namespace: string): ChartDataSeries {
    const releaseObject = new Renderer.K8sApi.KubeObject({
      apiVersion: "v1",
      kind: "HelmRelease",
      metadata: {
        uid: "",
        namespace: namespace,
        name: name,
        resourceVersion: "1",
        selfLink: `api/v1/helmreleases/${name}`
      }
    })
    const releaseData = this.generateNode(releaseObject);
    return releaseData;
  }

  renderTooltip(obj: Renderer.K8sApi.KubeObject) {
    if (!obj) return;

    const tooltipElement = document.getElementById("KubeForceChart-tooltip");

    if (tooltipElement) {
      if (obj instanceof Renderer.K8sApi.Pod) {
        ReactDOM.render(<PodTooltip obj={obj} />, tooltipElement)
      }
      else if (obj instanceof Renderer.K8sApi.Service) {
        ReactDOM.render(<ServiceTooltip obj={obj} />, tooltipElement)
      }
      else if (obj instanceof Renderer.K8sApi.Deployment) {
        ReactDOM.render(<DeploymentTooltip obj={obj} />, tooltipElement)
      }
      else if (obj instanceof Renderer.K8sApi.StatefulSet) {
        ReactDOM.render(<StatefulsetTooltip obj={obj} />, tooltipElement)
      }
      else if (obj instanceof Renderer.K8sApi.Ingress) {
        ReactDOM.render(<IngressTooltip obj={obj} />, tooltipElement)
      }
      else {
        ReactDOM.render(<DefaultTooltip obj={obj}/>, tooltipElement)
      }
      return tooltipElement.innerHTML;
    }
  }

  render() {
    if (!KubeResourceChart.isReady) {
      return (
        <Renderer.Component.Spinner />
      )
    }

    const theme = Renderer.Theme.getActiveTheme()
    return (
      <div id={this.props.id} className="KubeForceChart flex column">
        <div id="KubeForceChart-tooltip"/>
        <Renderer.Component.DrawerTitle title="Resources"/>

        <ForceGraph2D
          graphData={this.state.data}
          ref={this.chartRef}
          width={(document.getElementById("kube-resource-map") as HTMLElement)?.parentElement.firstElementChild?.clientWidth || 780}
          height={400}
          autoPauseRedraw={false}
          maxZoom={1.2}
          cooldownTicks={200}
          onEngineStop={() => {
            if (!this.initZoomDone) {
              if (this.nodes.length > 10) {
                this.chartRef.current?.zoomToFit(400);
              } else {
                this.chartRef.current?.zoom(1.2);
              }
              this.initZoomDone = true;
            }
          }}
          linkWidth={link => this.state.highlightLinks.has(link) ? 2 : 1}
          onNodeHover={this.handleNodeHover.bind(this)}
          onNodeDrag={this.handleNodeHover.bind(this)}
          nodeVal="value"
          nodeLabel={ (node) => this.renderTooltip((node as ChartDataSeries).object) }
          nodeVisibility={"visible"}
          linkColor={(link) => { return (link.source as ChartDataSeries).color }}
          onNodeClick={(node) => {
            if ((node as ChartDataSeries).object) {
              const { object } = node as ChartDataSeries;
              if (object.kind == "HelmRelease") {
                const path = `/apps/releases/${object.getNs()}/${object.getName()}?`
                Renderer.Navigation.navigate(path);
              } else {
                const detailsUrl = Renderer.Navigation.getDetailsUrl(object.selfLink);
                Renderer.Navigation.navigate(detailsUrl);
              }
            }
          }}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const padAmount = 0;
            const { name, value, color, image, object } = node as ChartDataSeries
            const label = name;
            const fontSize = 9;

            const r = Math.sqrt(Math.max(0, value || 10)) * 4 + padAmount;

            // draw outer circle
            if (object.getId() === this.props.object.getId()) {
              ctx.beginPath();
              ctx.lineWidth = 2;
              ctx.arc(node.x , node.y, r + 3, 0, 2 * Math.PI, false);
              ctx.strokeStyle = color;
              ctx.stroke();
              ctx.fillStyle = theme.colors["secondaryBackground"];
              ctx.fill();
              ctx.closePath();
            }

            // draw circle
            const size = this.state.hoverNode == node ? r + 1 : r

            ctx.beginPath();
            ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
            ctx.fillStyle = color || 'rgba(31, 120, 180, 0.92)';
            ctx.fill();

            // draw icon
            if (image) {
              try {
                ctx.drawImage(image, node.x - 15, node.y - 15, 30, 30);
              }
              catch (e) {
                console.error(e)
              }
            }

            // draw label
            ctx.textAlign = 'center';
            ctx.font = `${fontSize}px Arial`;
            ctx.textBaseline = 'middle';
            ctx.fillStyle = theme.colors["textColorPrimary"];
            ctx.fillText(label, node.x, node.y + r + (10 / globalScale));
          }}
        />
      </div>
    )
  }
}
