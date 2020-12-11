import "./KubeResourceMap.scss"
import React from "react";
import { Component, K8sApi, Util } from "@k8slens/extensions";
import { KubeResourceChart } from "./KubeResourceChart"
import { action, observable } from "mobx";
import { observer } from "mobx-react";

@observer
export class KubeResourceMap extends React.Component {
  protected namespaceStore = K8sApi.apiManager.getStore(K8sApi.namespacesApi) as K8sApi.NamespaceStore;

  @observable
  protected selectedNamespace: string | string[] = [];

  async componentDidMount() {
    await this.namespaceStore.loadAll()
  }

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

  @action
  onNamespacedChanged(event: any) {
    if (event.target.value != "") {
      this.selectedNamespace = event.target.value;
    } else {
      this.selectedNamespace = [];
    }
  }

  render() {
    return (
      <Component.TabLayout className="KubeResourceMap">
        <h2 className="flex gaps align-center">
          <span>Resource Map</span>
          <Component.Icon material="info" tooltip={this.renderChartLegend()}/>
          <select onChange={this.onNamespacedChanged.bind(this)}>
            <option value="">All namespaces</option>
            { this.namespaceStore.items.map(namespace => {
              return (
                <option key={namespace.getName()} value={namespace.getName()}>{namespace.getName()}</option>
              )
            })}
          </select>
        </h2>
        <br/>
        <KubeResourceChart namespace={this.selectedNamespace}/>
      </Component.TabLayout>
    );
  }
}
