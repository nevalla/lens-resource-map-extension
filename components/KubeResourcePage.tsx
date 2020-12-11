import "./KubeResourcePage.scss"
import React from "react";
import { Component } from "@k8slens/extensions";
import { KubeResourceChart } from "./KubeResourceChart"
import { observer } from "mobx-react";
import { NamespaceSelect, selectedNamespaces } from "./NamespaceSelect";
import { KubeResourceChartLegend } from "./KubeResourceChartLegend";

@observer
export class KubeResourcePage extends React.Component {
  render() {
    return (
      <Component.TabLayout className="KubeResourcePage">
        <header className="flex gaps align-center">
          <h2 className="flex gaps align-center">
            <span>Resource Map</span>
            <Component.Icon material="info" tooltip={<KubeResourceChartLegend/>}/>
          </h2>
          <NamespaceSelect className="box right"/>
        </header>
        <KubeResourceChart selectedNamespaces={Array.from(selectedNamespaces)}/>
      </Component.TabLayout>
    );
  }
}
