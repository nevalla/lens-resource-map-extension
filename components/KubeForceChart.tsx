import "./KubeForceChart.scss";
import { K8sApi, Navigation, Component, Util } from "@k8slens/extensions";
import { comparer, observable, reaction } from "mobx";
import { disposeOnUnmount, observer } from "mobx-react";
import React, { createRef, Fragment, MutableRefObject } from "react";
import { ForceGraph2D} from 'react-force-graph';
import * as d3 from "d3-force"
import ReactDOM from "react-dom";
import { PodTooltip} from "./PodTooltip";
import { ServiceTooltip} from "./ServiceTooltip";
import { ControllerTooltip} from "./ControllerTooltip";
import { DefaultTooltip} from "./DefaultTooltip";


type NodeObject = object & {
  id?: string | number;
  x?: number;
  y?: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
  fx?: number;
  fy?: number;
  fz?: number;
};

interface GraphData {
  nodes: NodeObject[];
  links: LinkObject[];
}

type LinkObject = object & {
  source?: string | number | NodeObject;
  target?: string | number | NodeObject;
};

export interface ChartDataSeries extends NodeObject {
  id?: string | number;
  object: K8sApi.KubeObject;
  kind: string;
  name?: string;
  namespace?: string;
  image?: HTMLImageElement;
  value?: number;
  collapsed?: boolean;
  disabled?: boolean;
  color?: string;
  tooltipHTML?: string;
  links?: LinkObject[];
  visible?: boolean;
}

export interface KubeForceChartProps {
  id?: string; // html-id to bind chart
  selectedNamespaces?: string[];
}

interface State {
  data: {
    nodes: ChartDataSeries[];
    links: LinkObject[];
  };
  highlightLinks?: Set<LinkObject>;
  hoverNode?: NodeObject;
}

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

@observer
export class KubeForceChart extends React.Component<KubeForceChartProps, State> {
  @observable static  isReady = false;
  @observable isUnmounting = false;
  @observable data: State;

  static defaultProps: KubeForceChartProps = {
    id: "kube-resource-map",
    selectedNamespaces: [],
  }

  static config: Config = {
    /*namespace: {
      color: "#3d90ce",
      icon: "https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/ns.svg",
      size: 30,

    },*/
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
      icon: "https://cncf-branding.netlify.app/img/projects/helm/icon/white/helm-icon-white.svg",
      size: 40,
    },
    persistentvolumeclaim: {
      color: "#cdff93",
      icon: "https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/pvc.svg",
      size: 20,
    }
  }

  protected links: LinkObject[] = [];
  protected nodes: ChartDataSeries[] = [];
  protected highlightLinks: Set<LinkObject> = new Set<LinkObject>();


  protected images: {[key: string]: HTMLImageElement; } = {}
  protected config = KubeForceChart.config
  private chartRef: MutableRefObject<any>;
  protected secretsData: any = [];
  protected configMapsData: any = [];
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
  protected configMapStore = K8sApi.apiManager.getStore(K8sApi.configMapApi) as K8sApi.ConfigMapsStore;

  private kubeObjectStores: K8sApi.KubeObjectStore[] = []
  private watchDisposers: Function[] = [];

  private previousNamespaces: string[] = [];

  state: Readonly<State> = {
    data: {
      nodes: [],
      links: []
    },
    highlightLinks: new Set<LinkObject>()
  }

  constructor(props: KubeForceChartProps) {
    super(props)
    this.chartRef = createRef();
    this.generateImages();
  }

  async componentDidMount() {
    this.setState(this.state)
    this.kubeObjectStores = [
      this.podsStore,
      this.deploymentStore,
      this.statefulsetStore,
      this.daemonsetStore,
      this.serviceStore,
      this.ingressStore,
      this.pvcStore,
      this.configMapStore,
      this.secretStore,
    ]
    await this.loadData();

    this.displayChart();

    const fg = this.chartRef.current;
    fg.zoom(1.3, 1000);
    fg.d3Force('link').strength(.5).distance(() => 80)
    fg.d3Force('charge', d3.forceManyBody().strength(-60).distanceMax(250)); // -12
    fg.d3Force('collide', d3.forceCollide(20));
    fg.d3Force("center", d3.forceCenter());

    const reactionOpts = {
      equals: comparer.structural,
    }
    disposeOnUnmount(this, [
      reaction(() => this.props.selectedNamespaces, this.namespaceChanged, reactionOpts),
      reaction(() => this.podsStore.items.toJSON(), () => { this.refreshItems(this.podsStore) }, reactionOpts),
      reaction(() => this.daemonsetStore.items.toJSON(), () => { this.refreshItems(this.daemonsetStore) }, reactionOpts),
      reaction(() => this.statefulsetStore.items.toJSON(), () => { this.refreshItems(this.statefulsetStore) }, reactionOpts),
      reaction(() => this.deploymentStore.items.toJSON(), () => { this.refreshItems(this.deploymentStore) }, reactionOpts),
      reaction(() => this.serviceStore.items.toJSON(), () => { this.refreshItems(this.serviceStore) }, reactionOpts),
      reaction(() => this.secretStore.items.toJSON(), () => { this.refreshItems(this.secretStore) }, reactionOpts),
      reaction(() => this.pvcStore.items.toJSON(), () => { this.refreshItems(this.pvcStore) }, reactionOpts),
      reaction(() => this.ingressStore.items.toJSON(), () => { this.refreshItems(this.ingressStore) }, reactionOpts),
      reaction(() => this.configMapStore.items.toJSON(), () => { this.refreshItems(this.configMapStore) }, reactionOpts)
    ])

  }

  namespaceChanged = () => {
    if (KubeForceChart.isReady && this.previousNamespaces.length != this.props.selectedNamespaces.length) {
      this.displayChart();
    }
  }

  displayChart = () => {
    this.previousNamespaces = this.props.selectedNamespaces;
    this.nodes = [];
    this.links = [];
    this.generateChartDataSeries();
  }

  getLinksForNode(node: ChartDataSeries): LinkObject[] {
    return this.links.filter((link) => link.source == node || link.target == node )
  }

  handleNodeHover(node: ChartDataSeries) {
    const highlightLinks = new Set<LinkObject>();
    const elem = document.getElementById(this.props.id);
    elem.style.cursor = node ? 'pointer' : null
    if (node) {
      this.getLinksForNode(node).forEach(link => highlightLinks.add(link));
    }
    this.setState({ highlightLinks: highlightLinks, hoverNode: node})
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
    this.unsubscribeStores();
  }

  protected refreshItems(store: K8sApi.KubeObjectStore) {
    // remove deleted objects
    this.nodes.filter(node => node.kind == store.api.kind).forEach(node => {
      if (!store.items.includes(node.object as K8sApi.KubeObject)) {
        if (["DaemonSet", "StatefulSet", "Deployment"].includes(node.kind)) {
          const helmReleaseName = this.getHelmReleaseName(node.object)
          if (helmReleaseName) {
            const helmReleaseNode = this.getHelmReleaseChartNode(helmReleaseName, node.namespace)
            if (this.getLinksForNode(helmReleaseNode).length === 1) {
              this.deleteNode({ node: helmReleaseNode })
            }
          }
        }
        this.deleteNode(node);
      }
    })
    this.generateChartDataSeries()
  }

  protected unsubscribeStores() {
    this.watchDisposers.forEach(dispose => dispose());
    this.watchDisposers.length = 0;
  }

  protected async loadData() {
    this.unsubscribeStores();
    for (const store of this.kubeObjectStores) {
      try {
        await store.loadAll();
        const unsuscribe = store.subscribe();
        this.watchDisposers.push(unsuscribe);
      } catch (error) {
        console.error("loading store error", error);
      }
    }
    KubeForceChart.isReady = true;
  }

  generateChartDataSeries = () => {
    const nodes = [...this.nodes];
    const links = [...this.links];

    this.generateSecrets();
    this.generateVolumeClaims();
    this.generateDeployments();
    this.generateStatefulSets();
    this.generateDaemonSets();
    this.generatePods();
    this.generateServices();
    this.generateIngresses();

    if (nodes.length != this.nodes.length || links.length != this.links.length) { // TODO: Improve the logic
      this.setState({
        data: {
          nodes: this.nodes,
          links: this.links,
        },
        highlightLinks: new Set<LinkObject>()
      })
    }

  }

  protected generatePods() {
    const { podsStore } = this;
    const { selectedNamespaces} = this.props;
    podsStore.getAllByNs(selectedNamespaces).map((pod: K8sApi.Pod) => {
      this.getPodNode(pod);
    });
  }

  protected generateDeployments() {
    const { deploymentStore } = this;
    const { selectedNamespaces} = this.props;

    deploymentStore.getAllByNs(selectedNamespaces).map((deployment: K8sApi.Deployment) => {
      const pods = deploymentStore.getChildPods(deployment)
      this.getControllerChartNode(deployment, pods);
    });
  }

  protected generateStatefulSets() {
    const { statefulsetStore } = this;
    const { selectedNamespaces} = this.props;

    statefulsetStore.getAllByNs(selectedNamespaces).map((statefulset: K8sApi.StatefulSet) => {
      const pods = statefulsetStore.getChildPods(statefulset)
      this.getControllerChartNode(statefulset, pods);
    });
  }

  protected generateDaemonSets() {
    const { daemonsetStore } = this;
    const { selectedNamespaces} = this.props;

    daemonsetStore.getAllByNs(selectedNamespaces).map((daemonset: K8sApi.DaemonSet) => {
      const pods = daemonsetStore.getChildPods(daemonset)
      this.getControllerChartNode(daemonset, pods)
    });
  }

  protected generateSecrets() {
    const { secretStore } = this;
    const { selectedNamespaces} = this.props;

    secretStore.getAllByNs(selectedNamespaces).forEach((secret: K8sApi.Secret) => {
      // Ignore service account tokens and tls secrets
      if (["kubernetes.io/service-account-token", "kubernetes.io/tls"].includes(secret.type.toString())) return;

      const secretNode = this.generateNode(secret);

      if (secret.type.toString() === "helm.sh/release.v1") {
        const helmReleaseNode = this.getHelmReleaseChartNode(secret.metadata.labels.name, secret.getNs())
        this.addLink({source: secretNode.id, target: helmReleaseNode.id});
      }

      // search for container links
      this.nodes.filter(node => node.kind === "Pod").forEach((podNode) => {
        const pod = (podNode.object as K8sApi.Pod)
        pod.getContainers().forEach((container) => {
          container.env?.forEach((env) => {
            const secretName = env.valueFrom?.secretKeyRef?.name;
            if (secretName == secret.getName()) {
              this.addLink({
                source: podNode.id, target: secretNode.id
              })
            }
          })
        })
      })
    })
  }

  protected generateVolumeClaims() {
    const { pvcStore } = this;
    const { selectedNamespaces} = this.props;

    pvcStore.getAllByNs(selectedNamespaces).forEach((pvc: K8sApi.PersistentVolumeClaim) => {
      this.generateNode(pvc);
    })
  }

  protected generateIngresses() {
    const { ingressStore } = this
    const { selectedNamespaces } = this.props
    ingressStore.getAllByNs(selectedNamespaces).forEach((ingress: K8sApi.Ingress) => {

      const ingressNode = this.generateNode(ingress);
      ingress.spec.tls?.filter(tls => tls.secretName).forEach((tls) => {
        const secret = this.secretStore.getByName(tls.secretName, ingress.getNs());
        if (secret) {
          const secretNode = this.generateNode(secret)
          if (secretNode) {
            this.addLink({ source: ingressNode.id, target: secretNode.id })
          }
        }
      })
      ingress.spec.rules.forEach((rule) => {
        rule.http.paths.forEach((path) => {
          const serviceName = (path.backend as any).serviceName || (path.backend as any).service.name
          if (serviceName) {
            const service = this.serviceStore.getByName(serviceName, ingress.getNs());
            if (service) {
              const serviceNode = this.generateNode(service)
              if (serviceNode) {
                this.addLink({ source: ingressNode.id, target: serviceNode.id });
              }
            }
          }
        })
      })
    })
  }

  protected generateServices() {
    const { serviceStore, podsStore} = this
    serviceStore.getAllByNs(this.props.selectedNamespaces).forEach((service: K8sApi.Service) => {
      const serviceNode = this.generateNode(service);
      const selector = service.spec.selector;
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
        pods.forEach((pod: K8sApi.Pod) => {
          const podNode = this.findNode(pod)
          if (podNode) {
            const serviceLink = { source: podNode.id, target: serviceNode.id}
            this.addLink(serviceLink);
          }
        })
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
  protected findNode(object: K8sApi.KubeObject) {
    if (!object) {
      return null;
    }

    return this.nodes.find(node => node.kind == object.kind && node.namespace && object.getNs() && node.name == object.getName())
  }

  protected deleteNode(opts: {node?: ChartDataSeries; object?: K8sApi.KubeObject}) {
    const node = opts.node || this.findNode(opts.object);

    if(!node) {
      return;
    }

    this.getLinksForNode(node).forEach(link => {
      this.links.splice(this.links.indexOf(link), 1);
    })

    this.nodes.splice(this.nodes.indexOf(node), 1);
  }

  generateNode(object: K8sApi.KubeObject): ChartDataSeries {
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

  getControllerChartNode(object: K8sApi.KubeObject, pods: K8sApi.Pod[]): ChartDataSeries {
    const controllerNode = this.generateNode(object);
    pods.forEach((pod: K8sApi.Pod) => {
      const podNode = this.getPodNode(pod)
      this.addLink({ source: controllerNode.id, target: podNode.id})
    })
    const releaseName = this.getHelmReleaseName(object);

    if (releaseName) {
      const release = this.getHelmReleaseChartNode(releaseName, object.getNs())
      this.addLink({target: release.id, source: controllerNode.id})
    }
    return controllerNode
  }

  getHelmReleaseName(object: K8sApi.KubeObject): string {
    if (object.metadata?.labels?.heritage === "Helm" && object.metadata?.labels?.release) {
      return object.metadata.labels.release
    }
    if (object.metadata?.labels && object.metadata?.annotations && object.metadata?.labels["app.kubernetes.io/managed-by"] == "Helm" && object.metadata?.annotations["meta.helm.sh/release-name"]) {
      return object.metadata.annotations["meta.helm.sh/release-name"]
    }
    return null
  }

  getPodNode(pod: K8sApi.Pod): ChartDataSeries {
    const podNode = this.generateNode(pod);
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
      if (secret && secret.type.toString() !== "kubernetes.io/service-account-token") {
        const dataItem = this.generateNode(secret)
        if (dataItem) {
          this.addLink({target: podNode.id, source: dataItem.id});
        }
      }
    })

    return podNode;
  }

  getHelmReleaseChartNode(name: string, namespace: string): ChartDataSeries {
    const releaseObject = new K8sApi.KubeObject({
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

  renderTooltip(obj: K8sApi.KubeObject) {
    if (!obj) return;

    const tooltipElement = document.getElementById("KubeForceChart-tooltip");

    if (tooltipElement) {
      if (obj instanceof K8sApi.Pod) {
        ReactDOM.render(<PodTooltip obj={obj} />, tooltipElement)
      }
      else if (obj instanceof K8sApi.Service) {
        ReactDOM.render(<ServiceTooltip obj={obj} />, tooltipElement)
      }
      else if (obj instanceof K8sApi.Deployment || obj instanceof K8sApi.StatefulSet) {
        ReactDOM.render(<ControllerTooltip obj={obj} />, tooltipElement)
      }
      else {
        ReactDOM.render(<DefaultTooltip obj={obj}/>, tooltipElement)
      }
      return tooltipElement.innerHTML;
    }
  }

  render() {
    console.log("render", KubeForceChart.isReady)
    if (!KubeForceChart.isReady) {
      return (
        <Component.Spinner />
      )
    }

    return (
      <div id={this.props.id} className="KubeForceChart flex center">
        <ForceGraph2D
          graphData={this.state.data}
          ref={this.chartRef}
          width={window.innerWidth}
          height={window.innerHeight}
          linkWidth={link => this.state.highlightLinks.has(link) ? 2 : 1}
          onNodeHover={this.handleNodeHover.bind(this)}
          onNodeDrag={this.handleNodeHover.bind(this)}
          nodeVal="value"
          nodeLabel={ (node: ChartDataSeries) => { return this.renderTooltip(node.object)} }
          nodeVisibility={"visible"}
          linkColor={(link) => { return (link.source as ChartDataSeries).color }}
          onNodeClick={(node: ChartDataSeries) => {
            if (node.object) {
              if (node.object.kind == "HelmRelease") {
                const path = `/apps/releases/${node.object.getNs()}/${node.object.getName()}?`
                Navigation.navigate(path);
              } else {
                const detailsUrl = Navigation.getDetailsUrl(node.object.selfLink);
                Navigation.navigate(detailsUrl);
              }
            }
          }}
          nodeCanvasObject={(node: ChartDataSeries, ctx, globalScale) => {
            const padAmount = 0;
            const label = node.name;
            const fontSize = 8;

            const r = Math.sqrt(Math.max(0, node.value || 10)) * 4 + padAmount;

            // draw outer circle
            if (["Deployment", "DaemonSet", "StatefulSet"].includes(node.kind)) {
              ctx.beginPath();
              ctx.lineWidth = 2;
              ctx.arc(node.x , node.y, r + 3, 0, 2 * Math.PI, false);
              ctx.strokeStyle = node.color;
              ctx.stroke();
              ctx.fillStyle= "#1e2124";
              ctx.fill();
              ctx.closePath();
            }

            // draw circle
            const size = this.state.hoverNode == node ? r + 1 : r

            ctx.beginPath();
            ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
            ctx.fillStyle = node.color || 'rgba(31, 120, 180, 0.92)';
            ctx.fill();

            // draw icon
            const image = node.image
            if (image) {
              ctx.drawImage(image, node.x - 15, node.y - 15, 30, 30);
            }

            // draw label
            ctx.textAlign = 'center';
            ctx.font = `${fontSize}px Arial`;
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgb(255,255,255)';
            ctx.fillText(label, node.x, node.y + r + (10 / globalScale));
          }}
        />
      </div>
    )
  }
}
