import React from "react"
import { Component, LensRendererExtension } from "@k8slens/extensions";
import { KubeResourceMapPage } from "./components/KubeResourceMap"

export default class KubeResorceMapRenderer extends LensRendererExtension {
  clusterPages = [
    {
      components: {
        Page: KubeResourceMapPage
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
}

export function MenuIcon(props: Component.IconProps): React.ReactElement {
  return (
    <Component.Icon
      {...props}
      material="bubble_chart"
      onClick={() => this.navigate()}
    />
  )
}
