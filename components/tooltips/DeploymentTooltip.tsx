import { Renderer, Common} from "@k8slens/extensions";
import React from "react";
export interface DeploymentTooltipProps {
  obj: Renderer.K8sApi.Deployment;
}

export class DeploymentTooltip extends React.Component<DeploymentTooltipProps> {
  render() {
    const obj = this.props.obj;
    const { status, spec } = obj;
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
          {obj.getSelectors().map(selector => {
            return (
              <div key={selector}>
                <Renderer.Component.Badge key={selector} label={selector}/>
              </div>
            )
          })
          }
        </Renderer.Component.DrawerItem>
        <Renderer.Component.DrawerItem name="Replicas">
          {`${spec.replicas} desired, ${status.updatedReplicas || 0} updated`},{" "}
          {`${status.replicas || 0} total, ${status.availableReplicas || 0} available`},{" "}
          {`${status.unavailableReplicas || 0} unavailable`}

        </Renderer.Component.DrawerItem>
        <Renderer.Component.DrawerItem name="Conditions" className="conditions" labelsOnly>
          {
            obj.getConditions().map(condition => {
              const { type, message, lastTransitionTime, status } = condition;

              return (
                <Renderer.Component.Badge
                  key={type}
                  label={type}
                  className={Common.Util.cssNames({ disabled: status === "False" }, type.toLowerCase())}
                  tooltip={(
                    <>
                      <p>{message}</p>
                      <p>Last transition time: {lastTransitionTime}</p>
                    </>
                  )}
                />
              );
            })
          }
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
