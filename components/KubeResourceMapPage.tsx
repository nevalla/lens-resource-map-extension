import "./KubeResourceMapPage.scss"
import * as React from "react";
import { Component } from "@k8slens/extensions";
import { KubeResourceMap } from "./KubeResourceMap"

export class KubeResourceMapPage extends React.Component {
  render(): React.ReactNode {
    return (
      <div className="KubeResourceMap">
        <Component.TabLayout>
          <div>
            <h1>Resource Map</h1>
            <br/>
            <KubeResourceMap />
          </div>
        </Component.TabLayout>
      </div>
    );
  }
}
