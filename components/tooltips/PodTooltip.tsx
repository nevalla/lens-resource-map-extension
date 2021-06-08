import { Renderer, Common } from "@k8slens/extensions";
import React from "react";

export interface PodTooltipProps {
  obj: Renderer.K8sApi.Pod;
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
        <Renderer.Component.DrawerItem name="Namespace">
          {obj.getNs()}
        </Renderer.Component.DrawerItem>
        <Renderer.Component.DrawerItem name="Created">
           {obj.getAge()} ago
        </Renderer.Component.DrawerItem>
        <Renderer.Component.DrawerItem name="Labels">
          {obj.getLabels().map(label => {
            return (
              <div key={label}>
                <Renderer.Component.Badge label={label} title={label}/>
              </div>
            )}
          )}
        </Renderer.Component.DrawerItem>
        <Renderer.Component.DrawerItem name="Node">
           {obj.getNodeName()}
        </Renderer.Component.DrawerItem>
        <Renderer.Component.DrawerItem name="Status">
          <span className={Common.Util.cssNames(obj.getStatusMessage().toLowerCase(), "pod-status")}>{obj.getStatusMessage()}</span>
        </Renderer.Component.DrawerItem>
        <Renderer.Component.DrawerItem name="Containers">
          {this.renderContainersStatus(obj)}
        </Renderer.Component.DrawerItem>
      </div>
    )
  }

  renderContainersStatus(pod: Renderer.K8sApi.Pod) {
    return pod.getContainerStatuses().map(containerStatus => {
      const { name, state, ready } = containerStatus;

      return (
        <div key={name}>
          <Renderer.Component.StatusBrick className={Common.Util.cssNames(state, { ready })}/> {name}
        </div>
      );
    });
  }
}
