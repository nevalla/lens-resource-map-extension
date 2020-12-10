import "./KubeResourceMap.scss"
import React from "react";
import { Component } from "@k8slens/extensions";
import { KubeResourceChart } from "./KubeResourceChart"

export class KubeResourceMap extends React.Component {
  render() {
    return (
      <Component.TabLayout className="KubeResourceMap">
        <h2>Resource Map</h2>
        <br/>
        <KubeResourceChart/>
      </Component.TabLayout>
    );
  }
}
