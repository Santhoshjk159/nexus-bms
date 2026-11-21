import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Code2, Copy, Download, Maximize2, Minimize2, Minus, Plus, ScanSearch } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Diagram } from "@/docs";

let seq = 0;
let mermaidPromise: Promise<typeof import("mermaid").default> | null = null;
/** Loads mermaid lazily in the browser only (never during SSR). */
function loadMermaid() {
  mermaidPromise ??= import("mermaid").then((m) => {
    m.default.initialize({
      startOnLoad: false, securityLevel: "strict", theme: "base", fontFamily: "IBM Plex Sans, sans-serif",
      themeVariables: { primaryColor: "#eef3fb", primaryBorderColor: "#1e3a6e", primaryTextColor: "#0f1f3d", lineColor: "#40618f", secondaryColor: "#e3f5f6", tertiaryColor: "#f7f9fc", fontSize: "14px", noteBkgColor: "#fff8e1", actorBkg: "#eef3fb", actorBorder: "#1e3a6e", signalColor: "#1d2a44" },
      flowchart: { htmlLabels: false, curve: "basis" }, sequence: { mirrorActors: false }, er: { useMaxWidth: false },
    });
    return m.default;
  });
  return mermaidPromise;
}

export function MermaidDiagram({ diagram, height = 560 }: { diagram: Diagram; height?: number }) {
  const wrap = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  const [view, setView] = useState({ z: 1, x: 0, y: 0 }); const viewRef = useRef(view); viewRef.current = view;
  const [showSrc, setShowSrc] = useState(false); const [full, setFull] = useState(false);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    let alive = true; setLoading(true); setError(""); setSvg("");
    loadMermaid().then(async (m) => {
      try { const { svg } = await m.render(`mmd-${diagram.id}-${++seq}`, diagram.source); if (alive) setSvg(svg); }
      catch (e) { if (alive) setError(e instanceof Error ? e.message : String(e)); }
    }).catch((e) => alive && setError(String(e))).finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [diagram.id, diagram.source]);

  const fit = useCallback(() => {
    const el = wrap.current, s = stage.current?.querySelector("svg"); if (!el || !s) return;
    const vb = s.viewBox.baseVal; const w = vb?.width || s.getBoundingClientRect().width, h = vb?.height || s.getBoundingClientRect().height;
    s.setAttribute("width", String(w)); s.setAttribute("height", String(h)); s.style.maxWidth = "none";
    const r = el.getBoundingClientRect(); const z = Math.min((r.width - 32) / w, (r.height - 32) / h, 2);
    setView({ z, x: (r.width - w * z) / 2, y: (r.height - h * z) / 2 });
  }, []);
  useEffect(() => { if (svg) requestAnimationFrame(fit); }, [svg, fit, full]);
  useEffect(() => { const f = () => setFull(document.fullscreenElement === wrap.current?.parentElement); document.addEventListener("fullscreenchange", f); return () => document.removeEventListener("fullscreenchange", f); }, []);

  const zoomAt = (factor: number, px?: number, py?: number) => {
    const r = wrap.current!.getBoundingClientRect(); const cx = px ?? r.width / 2, cy = py ?? r.height / 2; const v = viewRef.current;
    const z = Math.min(6, Math.max(0.15, v.z * factor)); const k = z / v.z;
    setView({ z, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k });
  };
  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const onWheel = (e: WheelEvent) => { e.preventDefault(); const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1); const r = el.getBoundingClientRect(); zoomAt(Math.exp(-dy * 0.0015), e.clientX - r.left, e.clientY - r.top); };
    el.addEventListener("wheel", onWheel, { passive: false }); return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const svgString = () => { const s = stage.current?.querySelector("svg"); if (!s) return ""; const c = s.cloneNode(true) as SVGSVGElement; c.setAttribute("xmlns", "http://www.w3.org/2000/svg"); return new XMLSerializer().serializeToString(c); };
  const save = (blob: Blob, ext: string) => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${diagram.id}-${diagram.title.replace(/\W+/g, "-").toLowerCase()}.${ext}`; a.click(); };
  const downloadSvg = () => { save(new Blob([svgString()], { type: "image/svg+xml" }), "svg"); toast.success("SVG downloaded"); };
  const downloadPng = () => {
    const s = stage.current?.querySelector("svg"); if (!s) return; const w = Number(s.getAttribute("width")) || 1200, h = Number(s.getAttribute("height")) || 800;
    const img = new Image(); img.onload = () => { const c = document.createElement("canvas"); c.width = w * 2; c.height = h * 2; const ctx = c.getContext("2d")!; ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, c.width, c.height); ctx.scale(2, 2); ctx.drawImage(img, 0, 0, w, h); c.toBlob((b) => { if (b) { save(b, "png"); toast.success("PNG downloaded"); } }); };
    img.onerror = () => toast.error("PNG export isn't supported for this diagram — download SVG instead");
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgString())));
  };
  const copy = () => { navigator.clipboard?.writeText(diagram.source); toast.success("Diagram source copied"); };
  const toggleFull = () => { const host = wrap.current?.parentElement; if (!host) return; if (document.fullscreenElement) void document.exitFullscreen(); else void host.requestFullscreen?.(); };

  return (
    <div className={cn("card-surface overflow-hidden", full && "flex h-screen flex-col rounded-none")}>
      <div className="flex flex-wrap items-center gap-1 border-b border-border px-3 py-2">
        <span className="num mr-2 text-xs font-medium text-muted-foreground">{diagram.id}</span>
        <span className="mr-auto text-sm font-semibold">{diagram.title}</span>
        <Button size="icon" variant="ghost" className="size-8" onClick={() => zoomAt(1 / 1.25)} aria-label="Zoom out" disabled={!svg}><Minus className="size-4" /></Button>
        <span className="num w-12 text-center text-xs text-muted-foreground">{Math.round(view.z * 100)}%</span>
        <Button size="icon" variant="ghost" className="size-8" onClick={() => zoomAt(1.25)} aria-label="Zoom in" disabled={!svg}><Plus className="size-4" /></Button>
        <Button size="sm" variant="ghost" onClick={fit} disabled={!svg}><ScanSearch className="size-4" />Fit</Button>
        <Button size="icon" variant="ghost" className="size-8" onClick={toggleFull} aria-label={full ? "Exit full screen" : "Full screen"}>{full ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}</Button>
        <Button size="sm" variant="ghost" onClick={downloadSvg} disabled={!svg}><Download className="size-4" />SVG</Button>
        <Button size="sm" variant="ghost" onClick={downloadPng} disabled={!svg}><Download className="size-4" />PNG</Button>
        <Button size="sm" variant={showSrc ? "secondary" : "ghost"} onClick={() => setShowSrc(!showSrc)}><Code2 className="size-4" />Source</Button>
        <Button size="icon" variant="ghost" className="size-8" onClick={copy} aria-label="Copy source"><Copy className="size-4" /></Button>
      </div>
      <div className={cn("grid", showSrc && "lg:grid-cols-[1fr_380px]", full && "min-h-0 flex-1")}>
        <div ref={wrap} data-testid="diagram-canvas" className="relative cursor-grab touch-none overflow-hidden bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:16px_16px] active:cursor-grabbing" style={{ height: full ? "100%" : height }}
          onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, ox: view.x, oy: view.y }; }}
          onPointerMove={(e) => { const d = drag.current; if (d) setView((v) => ({ ...v, x: d.ox + e.clientX - d.x, y: d.oy + e.clientY - d.y })); }}
          onPointerUp={() => (drag.current = null)} onDoubleClick={fit}>
          {loading && <p className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">Rendering diagram…</p>}
          {error ? (
            <div className="absolute inset-0 overflow-auto p-5">
              <div className="flex items-start gap-2 rounded-md bg-destructive-soft p-3 text-sm text-destructive"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><div><p className="font-semibold">This diagram could not be rendered.</p><p className="mt-1 text-xs">{error}</p></div></div>
              <pre className="num mt-3 whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">{diagram.source}</pre>
            </div>
          ) : (
            <div ref={stage} className="absolute left-0 top-0 origin-top-left" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})` }} dangerouslySetInnerHTML={{ __html: svg }} />
          )}
          {svg && <p className="pointer-events-none absolute bottom-2 left-3 text-[11px] text-muted-foreground">Scroll to zoom · drag to pan · double-click to fit</p>}
        </div>
        {showSrc && <pre className="num max-h-[560px] overflow-auto border-l border-border bg-muted/50 p-4 text-xs leading-relaxed">{diagram.source}</pre>}
      </div>
      {!full && <p className="border-t border-border px-4 py-3 text-sm text-muted-foreground">{diagram.explanation}</p>}
    </div>
  );
}
