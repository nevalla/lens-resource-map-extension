import { Div, Span } from "@k8slens/element-components";
import { forceCollide } from "d3-force-3d";
import ForceGraphCanvas from "force-graph";
import { useEffect, useRef, useState } from "react";
import type { GraphNode, ResourceGraph } from "../graph/types";
import { describeNode } from "./describe-node";
import { type DrawnGraph, type DrawnLink, type DrawnNode, endpointKey, nextDrawnGraph } from "./drawn-graph";
import { iconImageOf, kindStyles, statusColors } from "./kind-styles";

export interface ForceGraphProps {
  readonly graph: ResourceGraph;
  readonly onNodeClick: (node: GraphNode) => void;
  // The node the graph is about, drawn highlighted.
  readonly focusKey?: string;
  // The view is fitted to the graph once it settles, and again whenever this changes.
  readonly fitKey?: string;
}

interface Hover {
  readonly node: GraphNode;
  readonly x: number;
  readonly y: number;
}

const fallbackStyle = kindStyles.ConfigMap;
const labelFontSize = 6;

// Below this zoom labels are unreadable anyway, and only clutter.
const minLabelScale = 0.7;

// A thin wrapper over a canvas library: React owns the element, the library owns what is drawn in it.
export const ForceGraph = ({ graph, onNodeClick, focusKey, fitKey }: ForceGraphProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<ForceGraphCanvas<DrawnNode, DrawnLink>>(null);
  const drawnRef = useRef<DrawnGraph>({ nodes: [], links: [] });
  const hoverRef = useRef<string | undefined>(undefined);
  const pointerRef = useRef({ x: 0, y: 0 });
  const onNodeClickRef = useRef(onNodeClick);
  const focusKeyRef = useRef(focusKey);
  const isFittedRef = useRef(false);
  const [hover, setHover] = useState<Hover>();

  onNodeClickRef.current = onNodeClick;
  focusKeyRef.current = focusKey;

  useEffect(() => {
    const container = containerRef.current!;
    let theme = themeOf(container);

    const canvas = new ForceGraphCanvas<DrawnNode, DrawnLink>(container)
      .nodeId("id")
      .onRenderFramePre((context, scale) => {
        theme = themeOf(container);
        drawDotGrid(context, scale, canvas.screen2GraphCoords(0, 0), canvas.screen2GraphCoords(canvas.width(), canvas.height()), theme);
      })
      .nodeCanvasObject((drawn, context, scale) => drawNode(drawn, context, scale, theme, drawn.id === focusKeyRef.current))
      .nodePointerAreaPaint((drawn, color, context) => {
        context.fillStyle = color;
        context.beginPath();
        context.arc(drawn.x ?? 0, drawn.y ?? 0, styleOf(drawn.node).radius + 2, 0, 2 * Math.PI);
        context.fill();
      })
      .linkColor((link) => (isHovered(link, hoverRef.current) ? theme.text : theme.muted))
      .linkWidth((link) => (isHovered(link, hoverRef.current) ? 2 : 1))
      .linkDirectionalArrowLength(4)
      .linkDirectionalArrowRelPos(1)
      .cooldownTicks(200)
      .onEngineStop(() => {
        if (!isFittedRef.current) {
          isFittedRef.current = true;
          fitView(canvas);
        }
      })
      .onNodeHover((drawn) => {
        hoverRef.current = drawn?.id;
        redraw(canvas);
        container.style.cursor = drawn?.node.resource ? "pointer" : "";
        setHover(drawn ? { node: drawn.node, ...pointerRef.current } : undefined);
      })
      .onNodeClick((drawn) => onNodeClickRef.current(drawn.node));

    // Repulsion only between near neighbours, and a weak pull to the centre, so unconnected
    // groups pack together instead of drifting apart, with room for every node and its label.
    canvas.d3Force("charge")?.strength(-130).distanceMax(250);
    canvas.d3Force("link")?.distance(55);
    canvas.d3Force("gravity", gravity(0.015));
    canvas.d3Force("collide", forceCollide<DrawnNode>().radius((drawn) => styleOf(drawn.node).radius + 18));

    const resizeObserver = new ResizeObserver(([entry]) => {
      canvas.width(entry.contentRect.width).height(entry.contentRect.height);
    });

    const trackPointer = (event: PointerEvent) => {
      const bounds = container.getBoundingClientRect();

      pointerRef.current = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    };

    resizeObserver.observe(container);
    container.addEventListener("pointermove", trackPointer);
    canvasRef.current = canvas;

    return () => {
      container.removeEventListener("pointermove", trackPointer);
      resizeObserver.disconnect();
      canvas._destructor();
      canvasRef.current = null;
      drawnRef.current = { nodes: [], links: [] };
    };
  }, []);

  useEffect(() => {
    isFittedRef.current = false;
  }, [fitKey]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const { drawn, isSameStructure } = nextDrawnGraph(drawnRef.current, graph);

    drawnRef.current = drawn;

    if (hoverRef.current && !graph.nodes.has(hoverRef.current)) {
      hoverRef.current = undefined;
      setHover(undefined);
    }

    if (isSameStructure) {
      // Only what is drawn changed, a pod's status say: redraw without stirring the layout.
      redraw(canvas);
    } else {
      canvas.graphData(drawn);
    }
  }, [graph]);

  return (
    <Div $ref={containerRef} $relative $size="full" $color="textDefault" $backgroundColor="backgroundPrimary" $overflow="hidden">
      {hover && <NodeTooltip hover={hover} />}
    </Div>
  );
};

const NodeTooltip = ({ hover }: { hover: Hover }) => {
  const { title, rows } = describeNode(hover.node);

  return (
    <Div
      $absolute
      $noPointerEvents
      $padding="s"
      $backgroundColor="backgroundSecondary"
      $border={{ color: "borderPrimary", width: "xxs", radius: "m" }}
      $boxShadow
      $style={{ left: hover.x + 12, top: hover.y + 12, zIndex: 1, maxWidth: 360 }}
    >
      <Span $font={{ bold: true }}>{title}</Span>
      {rows.map(([name, value]) => (
        <Div key={name} $flex={{ direction: "horizontal", gap: "s" }}>
          <Span $color="textMuted">{name}</Span>
          <Span>{value}</Span>
        </Div>
      ))}
    </Div>
  );
};

interface Theme {
  readonly text: string;
  readonly muted: string;
  readonly background: string;
}

// The container takes its colours from Lens's theme, so the canvas follows it too.
const themeOf = (container: HTMLElement): Theme => {
  const style = getComputedStyle(container);

  return { text: style.color, muted: withAlpha(style.color, 0.35), background: style.backgroundColor };
};

const gridSpacing = 20;
const minGridSpacingOnScreen = 20;
const gridDotSize = 1.5;
const gridDotOpacity = 0.25;

interface Point {
  readonly x: number;
  readonly y: number;
}

// Drawn in graph coordinates, so it pans and zooms with the graph. Sparser as the view zooms
// out, so the dots never crowd into noise.
const drawDotGrid = (context: CanvasRenderingContext2D, scale: number, topLeft: Point, bottomRight: Point, theme: Theme) => {
  let spacing = gridSpacing;

  while (spacing * scale < minGridSpacingOnScreen) {
    spacing *= 2;
  }

  const size = gridDotSize / scale;

  context.save();
  context.globalAlpha = gridDotOpacity;
  context.fillStyle = theme.text;

  for (let x = Math.floor(topLeft.x / spacing) * spacing; x <= bottomRight.x; x += spacing) {
    for (let y = Math.floor(topLeft.y / spacing) * spacing; y <= bottomRight.y; y += spacing) {
      context.fillRect(x - size / 2, y - size / 2, size, size);
    }
  }

  context.restore();
};

const withAlpha = (rgb: string, alpha: number) => rgb.replace(/^rgba?\(([^,]+),([^,]+),([^,)]+).*$/, `rgba($1,$2,$3,${alpha})`);

const gravity = (strength: number) => {
  let nodes: DrawnNode[] = [];

  const force = (alpha: number) => {
    nodes.forEach((node) => {
      node.vx = (node.vx ?? 0) - (node.x ?? 0) * strength * alpha;
      node.vy = (node.vy ?? 0) - (node.y ?? 0) * strength * alpha;
    });
  };

  force.initialize = (initialNodes: DrawnNode[]) => {
    nodes = initialNodes;
  };

  return force;
};

const fitPadding = 40;
const fitDurationMs = 400;

// A few nodes fitted to the view would be drawn huge, so fitting never zooms in past this.
const maxFitZoom = 1.5;

const fitView = (canvas: ForceGraphCanvas<DrawnNode, DrawnLink>) => {
  const bbox = canvas.getGraphBbox();

  // Nothing to fit an empty graph to; the library has no box for it.
  if (!bbox) {
    return;
  }

  const { x, y } = bbox;
  const width = x[1] - x[0] + 2 * fitPadding;
  const height = y[1] - y[0] + 2 * fitPadding;
  const zoom = Math.min(canvas.width() / width, canvas.height() / height, maxFitZoom);

  canvas.centerAt((x[0] + x[1]) / 2, (y[0] + y[1]) / 2, fitDurationMs);
  canvas.zoom(zoom, fitDurationMs);
};

// Setting a paint function again is what makes the library repaint a settled graph.
const redraw = (canvas: ForceGraphCanvas<DrawnNode, DrawnLink>) => canvas.nodeCanvasObject(canvas.nodeCanvasObject());

const styleOf = (node: GraphNode) => kindStyles[node.kind] ?? fallbackStyle;

const isHovered = (link: DrawnLink, hoveredKey: string | undefined) =>
  hoveredKey !== undefined && (endpointKey(link.source) === hoveredKey || endpointKey(link.target) === hoveredKey);

const drawNode = (drawn: DrawnNode, context: CanvasRenderingContext2D, scale: number, theme: Theme, isFocused: boolean) => {
  const { node } = drawn;
  const style = styleOf(node);
  const x = drawn.x ?? 0;
  const y = drawn.y ?? 0;
  const fill = node.kind === "Pod" && node.status ? statusColors[node.status] : style.color;

  if (style.ringed || isFocused) {
    context.beginPath();
    context.arc(x, y, style.radius + 3, 0, 2 * Math.PI);
    context.lineWidth = isFocused ? 3 : 2;
    context.strokeStyle = isFocused ? theme.text : node.status ? statusColors[node.status] : style.color;
    context.stroke();
  }

  context.beginPath();
  context.arc(x, y, style.radius, 0, 2 * Math.PI);
  context.fillStyle = fill;
  context.fill();

  const icon = iconImageOf(style);
  const iconSize = style.radius * 1.5;

  if (icon.complete) {
    context.drawImage(icon, x - iconSize / 2, y - iconSize / 2, iconSize, iconSize);
  }

  if (scale >= minLabelScale || isFocused) {
    context.font = `${labelFontSize}px sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "top";
    context.fillStyle = theme.text;
    context.fillText(node.name, x, y + style.radius + 4);
  }
};
