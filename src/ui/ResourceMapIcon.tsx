import { Svg, type SvgProps } from "@k8slens/element-components";

// A workload, ringed as on the map, and the resources it links to. Sized the way
// Lens's own glyphs are: a fixed t-shirt size, drawn in the colour around it.
export const ResourceMapIcon = ({ $size = "l", ...props }: SvgProps) => (
  <Svg
    $size={typeof $size === "string" ? { min: $size, max: $size, size: $size } : $size}
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    {...props}
  >
    <g strokeWidth={1.6} strokeLinecap="round">
      <line x1="12" y1="8" x2="5" y2="18" />
      <line x1="12" y1="8" x2="19" y2="18" />
      <line x1="5" y1="18" x2="19" y2="18" />
    </g>
    <circle cx="12" cy="7" r="4.6" fill="none" strokeWidth={1.4} />
    <circle cx="12" cy="7" r="2.6" stroke="none" />
    <circle cx="5" cy="18" r="2.6" stroke="none" />
    <circle cx="19" cy="18" r="2.6" stroke="none" />
  </Svg>
);
