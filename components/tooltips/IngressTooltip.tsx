import { Common, Renderer,} from "@k8slens/extensions";
import React from "react";

export interface IngressTooltipProps {
  obj: Renderer.K8sApi.Ingress;
}

interface IExtensionsBackend {
  serviceName: string;
  servicePort: number;
}

// networking.k8s.io/v1
interface INetworkingBackend {
  service: IIngressService;
}

type IIngressBackend = IExtensionsBackend | INetworkingBackend;

interface IIngressService {
  name: string;
  port: {
    name?: string;
    number?: number;
  }
}

export class IngressTooltip extends React.Component<IngressTooltipProps> {
  render() {
    const obj = this.props.obj
    return (
      <div className="KubeResourceChartTooltip ingress-tooltip flex column">
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
        {this.renderPaths(obj)}

      </div>
    )
  }

  renderPaths(ingress: Renderer.K8sApi.Ingress) {
    const { spec: { rules } } = ingress;

    if (!rules || !rules.length) return null;

    return rules.map((rule, index) => {
      return (
        <div className="rules" key={index}>
          {rule.host && (
            <div className="host-title">
              <>Host: {rule.host}</>
            </div>
          )}
          {rule.http && (
            <Renderer.Component.Table className="paths">
              {
                rule.http.paths.map((path, index) => {
                  const { serviceName, servicePort } = this.getBackendServiceNamePort(path.backend);
                  const backend = `${serviceName}:${servicePort}`;

                  return (
                    <Renderer.Component.TableRow key={index}>
                      <Renderer.Component.TableCell className="path">{path.path || ""}</Renderer.Component.TableCell>
                      <Renderer.Component.TableCell className="backends">
                        <p key={backend}>{backend}</p>
                      </Renderer.Component.TableCell>
                    </Renderer.Component.TableRow>
                  );
                })
              }
            </Renderer.Component.Table>
          )}
        </div>
      );
    });
  }

  getBackendServiceNamePort(backend: IIngressBackend) {
    // .service is available with networking.k8s.io/v1, otherwise using extensions/v1beta1 interface
    const serviceName = "service" in backend ? backend.service.name : backend.serviceName;
    // Port is specified either with a number or name
    const servicePort = "service" in backend ? backend.service.port.number ?? backend.service.port.name : backend.servicePort;

    return { serviceName, servicePort };
  };
}
