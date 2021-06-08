import { Renderer, Common} from "@k8slens/extensions";
import React from "react";

export interface StatefulsetTooltipProps {
obj: Renderer.K8sApi.StatefulSet;
}

export class StatefulsetTooltip extends React.Component<StatefulsetTooltipProps> {
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
          {obj.getSelectors().map((selector: string) => {
            return (
              <div key={selector}>
                <Renderer.Component.Badge key={selector} label={selector}/>
              </div>
            )
          })
          }
        </Renderer.Component.DrawerItem>
        <Renderer.Component.DrawerItem name="Replicas">
           {obj.getReplicas()}
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
