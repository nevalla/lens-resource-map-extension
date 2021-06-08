import { Common, Renderer,} from "@k8slens/extensions";
import React from "react";

export interface ServiceTooltipProps {
  obj: Renderer.K8sApi.Service;
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
        <Renderer.Component.DrawerItem name="Namespace">
          {obj.getNs()}
        </Renderer.Component.DrawerItem>
        <Renderer.Component.DrawerItem name="Created">
           {obj.getAge()} ago
        </Renderer.Component.DrawerItem>
        <Renderer.Component.DrawerItem name="Selector" labelsOnly>
          {obj.getSelector().map(selector => {
            return (
              <div key={selector}>
                <Renderer.Component.Badge key={selector} label={selector}/>
              </div>
            )
          })
          }
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
