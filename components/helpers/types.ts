import { Renderer } from "@k8slens/extensions";

export type NodeObject = object & {
  id?: string|number;
  x?: number;
  y?: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
  fx?: number;
  fy?: number;
  fz?: number;
};

export type LinkObject = object & {
  source?: string|number|NodeObject;
  target?: string|number|NodeObject;
};

export interface ChartDataSeries extends NodeObject {
  id?: string|number;
  object: Renderer.K8sApi.KubeObject;
  kind: string;
  name?: string;
  namespace?: string;
  image?: HTMLImageElement;
  value?: number;
  collapsed?: boolean;
  disabled?: boolean;
  color?: string;
  tooltipHTML?: string;
  links?: LinkObject[];
  visible?: boolean;
}
