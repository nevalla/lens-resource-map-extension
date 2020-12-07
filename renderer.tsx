import { LensRendererExtension, Component } from "@k8slens/extensions";
import React from "react"
import KubeResourceMapPage from "./components/KubeResourceMap"

const { Icon } = Component;

export default class KubeResorceMapRenderer extends LensRendererExtension {

  clusterPages = [
    // a standard cluster page
    {
      id: "kubeResourceMap",
      title: "Resource Map",
      components: {
        Page: KubeResourceMapPage
      }
    },
  ]

  clusterPageMenus = [
    // a cluster menu item which links to a cluster page
    {
      title: "Cluster Page",
      target: {
        pageId: "kubeResourceMap",
        params: {}
      },
      components: {
        Icon: (): JSX.Element => <Icon material="pages" />,
      }
    }
  ]
}
