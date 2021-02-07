import { Component, K8sApi, Util,} from "@k8slens/extensions";
import React from "react";

export interface ServiceTooltipProps {
  obj: K8sApi.Service;
}

export class ServiceTooltip extends React.Component<ServiceTooltipProps> {
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
          {obj.getSelector().map(selector => {
            return (
              <div key={selector}>
                <Component.Badge key={selector} label={selector}/>
              </div>
            )
          })
          }
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
