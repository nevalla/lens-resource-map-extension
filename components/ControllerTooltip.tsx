import { Component, K8sApi, Util,} from "@k8slens/extensions";
import React from "react";

export interface ControllerTooltipProps {
  obj: K8sApi.Deployment | K8sApi.StatefulSet;
}

export class ControllerTooltip extends React.Component<ControllerTooltipProps> {
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
        <Component.DrawerItem name="Selector" labelsOnly>
          {obj.getSelectors().map(selector => {
            return (
              <div key={selector}>
                <Component.Badge key={selector} label={selector}/>
              </div>
            )
          })
          }
        </Component.DrawerItem>
        <Component.DrawerItem name="Replicas">
           {obj.getReplicas()}
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
