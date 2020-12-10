import "./KubeResourceMap.scss"
import React from "react";
import { Component } from "@k8slens/extensions";
import { KubeResourceChart } from "./KubeResourceChart"

export class KubeResourceMap extends React.Component {
  renderChartLegend() {
    const iconSize = 32;
    return (
      <div className="KubeResourceChartLegend flex column">
        <p className="title">Legend:</p>
        {Object.entries(KubeResourceChart.icons).map(([kind, iconSrc]) => {
          const resource = kind[0].toUpperCase() + kind.substr(1);
          const color = KubeResourceChart.colors[kind as "pod"];
          return (
            <div key={kind} className="resource flex gaps align-center" style={{ borderRight: `10px solid ${color}` }}>
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
        <h2 className="flex gaps align-center">
          <span>Resource Map</span>
          <Component.Icon material="info" tooltip={this.renderChartLegend()}/>
        </h2>
        <br/>
        <KubeResourceChart/>
      </Component.TabLayout>
    );
  }
}
