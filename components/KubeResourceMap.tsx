import "./KubeResourceMap.scss"
import React from "react";
import { Component } from "@k8slens/extensions";
import { KubeResourceChart } from "./KubeResourceChart"
import { observer } from "mobx-react";
import { NamespaceSelect, selectedNamespaces } from "./NamespaceSelect";

@observer
export class KubeResourceMap extends React.Component {
  renderChartLegend() {
    const iconSize = 32;
    return (
      <div className="KubeResourceChartLegend flex column">
        <p className="title">Legend:</p>
        {Object.entries(KubeResourceChart.icons).map(([kind, iconSrc]) => {
          const resource = kind[0].toUpperCase() + kind.substr(1);
          const color = KubeResourceChart.colors[kind as "pod"];
          const style = { "--color": color } as React.CSSProperties;
          return (
            <div key={kind} className="resource flex gaps align-center" style={style}>
              <img className="resource-icon" src={iconSrc} width={iconSize} height={iconSize} alt={kind}/>
              <span className="resource-kind">{resource}</span>
            </div>
          )
        })}
      </div>
    )
  }

  render() {
    return (
      <Component.TabLayout className="KubeResourceMap">
        <header className="flex gaps align-center">
          <h2 className="flex gaps align-center">
            <span>Resource Map</span>
            <Component.Icon material="info" tooltip={this.renderChartLegend()}/>
          </h2>
          <NamespaceSelect className="box right"/>
        </header>
        <br/>
        <KubeResourceChart
          selectedNamespaces={Array.from(selectedNamespaces)}
        />
      </Component.TabLayout>
    );
  }
}
