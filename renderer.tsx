import React from "react"
import { Renderer } from "@k8slens/extensions";
import { KubeForceChart, KubeResourcePage } from "./components"
import { KubeControllerChart } from "./components/KubeControllerChart";
import { KubePodChart } from "./components/KubePodChart";
import { KubeIngressChart } from "./components/KubeIngressChart";
import { KubeServiceChart } from "./components/KubeServiceChart";

export default class KubeResorceMapRenderer extends Renderer.LensExtension {
  kubeObjectDetailItems = [
    {
      kind: "Deployment",
      apiVersions: ["apps/v1"],
      priority: 10,
      components: {
        Details: (props: Renderer.Component.KubeObjectDetailsProps<Renderer.K8sApi.Deployment>) => <KubeControllerChart {...props} />
      }
    },
    {
      kind: "DaemonSet",
      apiVersions: ["apps/v1"],
      priority: 10,
      components: {
        Details: (props: Renderer.Component.KubeObjectDetailsProps<Renderer.K8sApi.DaemonSet>) => <KubeControllerChart {...props} />
      }
    },
    {
      kind: "StatefulSet",
      apiVersions: ["apps/v1"],
      priority: 10,
      components: {
        Details: (props: Renderer.Component.KubeObjectDetailsProps<Renderer.K8sApi.StatefulSet>) => <KubeControllerChart {...props} />
      }
    },
    {
      kind: "Pod",
      apiVersions: ["v1"],
      priority: 10,
      components: {
        Details: (props: Renderer.Component.KubeObjectDetailsProps<Renderer.K8sApi.Pod>) => <KubePodChart {...props} />
      }
    },
    {
      kind: "Service",
      apiVersions: ["v1"],
      priority: 10,
      components: {
        Details: (props: Renderer.Component.KubeObjectDetailsProps<Renderer.K8sApi.Pod>) => <KubeServiceChart {...props} />
      }
    },
    {
      kind: "Ingress",
      apiVersions: ["networking.k8s.io/v1"],
      priority: 10,
      components: {
        Details: (props: Renderer.Component.KubeObjectDetailsProps<Renderer.K8sApi.Pod>) => <KubeIngressChart {...props} />
      }
    }

  ];

  clusterPages = [
    {
      components: {
        Page: KubeResourcePage
      }
    },
  ]

  clusterPageMenus = [
    {
      title: "Resource Map",
      components: {
        Icon: MenuIcon,
      }
    }
  ]

  kubeWorkloadsOverviewItems = [
    {
      priority: 25,
      components : {
        Details: () => { return (
          <div className="ResourceMapOverviewDetail">
            <div className="header flex gaps align-center">
              <h5 className="box grow">Resources</h5>
            </div>
            <div className="content">
              <KubeForceChart height={480} />
            </div>
          </div>
        )}
      }
    }
  ]
}

export function MenuIcon(props: Renderer.Component.IconProps): React.ReactElement {
  return (
    <Renderer.Component.Icon
      material="bubble_chart"
      onClick={() => this.navigate()}
    />
  )
}
