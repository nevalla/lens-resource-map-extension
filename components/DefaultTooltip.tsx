import { Component, K8sApi, Util,} from "@k8slens/extensions";
import React from "react";

export interface DefaultTooltipProps {
  obj: K8sApi.KubeObject;
}

export class DefaultTooltip extends React.Component<DefaultTooltipProps> {
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
           { obj.metadata.creationTimestamp && `${obj.getAge()} ago`}
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
