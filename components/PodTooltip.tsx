import { Component, K8sApi, Util,} from "@k8slens/extensions";
import React from "react";

export interface PodTooltipProps {
  obj: K8sApi.Pod;
}

export class PodTooltip extends React.Component<PodTooltipProps> {
  render() {
    const obj = this.props.obj
    return (
      <div className="KubeResourceChartTooltip flex column">
        <div>
          <b>{obj.kind} - {obj.getName()}</b>
        </div>
        <hr/>
        <Component.DrawerItem name="Namespace">
          {obj.getNs()}
        </Component.DrawerItem>
        <Component.DrawerItem name="Created">
           {obj.getAge()} ago
        </Component.DrawerItem>
        <Component.DrawerItem name="Labels">
          {obj.getLabels().map(label => {
            return (
              <div key={label}>
                <Component.Badge label={label} title={label}/>
              </div>
            )}
          )}
        </Component.DrawerItem>
        <Component.DrawerItem name="Node">
           {obj.getNodeName()}
        </Component.DrawerItem>
        <Component.DrawerItem name="Status">
          <span className={Util.cssNames(obj.getStatusMessage().toLowerCase(), "pod-status")}>{obj.getStatusMessage()}</span>
        </Component.DrawerItem>
        <Component.DrawerItem name="Containers">
          {this.renderContainersStatus(obj)}
        </Component.DrawerItem>
      </div>
    )
  }

  renderContainersStatus(pod: K8sApi.Pod) {
    return pod.getContainerStatuses().map(containerStatus => {
      const { name, state, ready } = containerStatus;

      return (
        <div key={name}>
          <Component.StatusBrick className={Util.cssNames(state, { ready })}/> {name}
        </div>
      );
    });
  }
}
