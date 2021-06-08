import { Renderer, Common } from "@k8slens/extensions";
import React from "react";

export interface DefaultTooltipProps {
  obj: Renderer.K8sApi.KubeObject;
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
        <Renderer.Component.DrawerItem name="Namespace">
          {obj.getNs()}
        </Renderer.Component.DrawerItem>
        <Renderer.Component.DrawerItem name="Created">
           { obj.metadata.creationTimestamp && `${obj.getAge()} ago`}
        </Renderer.Component.DrawerItem>
      </div>
    )
  }

  renderContainersStatus(pod: Renderer.K8sApi.Pod) {
    return pod.getContainerStatuses().map((containerStatus: Renderer.K8sApi.IPodContainerStatus) => {
      const { name, state, ready } = containerStatus;

      return (
        <div key={name}>
          <Renderer.Component.StatusBrick className={Common.Util.cssNames(state, { ready })}/> {name}
        </div>
      );
    });
  }
}
