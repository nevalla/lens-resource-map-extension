// The package ships no types; only what the map uses is declared.
declare module "d3-force-3d" {
  interface CollideForce<N> {
    (alpha: number): void;
    initialize: (nodes: N[]) => void;
    radius: (radius: (node: N) => number) => CollideForce<N>;
  }

  export function forceCollide<N>(): CollideForce<N>;
}
