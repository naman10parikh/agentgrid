import { useCallback } from "react";

interface GraphExportProps {
  svgSelector: string;
}

/**
 * Export graph as PNG or SVG.
 */
export function GraphExport({ svgSelector }: GraphExportProps) {
  const exportAsSVG = useCallback(() => {
    const svg = document.querySelector(svgSelector) as SVGSVGElement | null;
    if (!svg) return;

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `agentgrid-graph-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [svgSelector]);

  const exportAsPNG = useCallback(() => {
    const svg = document.querySelector(svgSelector) as SVGSVGElement | null;
    if (!svg) return;

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const img = new Image();
    const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const dpr = window.devicePixelRatio || 1;
      canvas.width = img.width * dpr;
      canvas.height = img.height * dpr;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.drawImage(img, 0, 0);

      const pngUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = `agentgrid-graph-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    };

    img.src = url;
  }, [svgSelector]);

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={exportAsPNG}
        className="rounded border border-grid-border px-2 py-1 font-mono text-[10px] text-grid-fg-muted hover:text-grid-fg-secondary"
        title="Export as PNG"
      >
        PNG
      </button>
      <button
        onClick={exportAsSVG}
        className="rounded border border-grid-border px-2 py-1 font-mono text-[10px] text-grid-fg-muted hover:text-grid-fg-secondary"
        title="Export as SVG"
      >
        SVG
      </button>
    </div>
  );
}
