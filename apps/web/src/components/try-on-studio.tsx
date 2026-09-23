"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TryOnCatalog, TryOnLook } from "@photomatcher/types";
import { useToast } from "@/components/toast";
import { ColorField } from "@/components/color-field";
import {
  DEFAULT_ENABLED,
  DEFAULT_STRENGTH,
  NoFaceError,
  buildTryOnMasks,
  cloneMasks,
  copyLayer,
  dataUrlToImage,
  drawOriginal,
  fileToImage,
  renderTryOn,
  restoreLayer,
  stampStrokeInPlace,
  type StudioFeature,
  type TryOnEnabled,
  type TryOnMasks,
  type TryOnStrength,
} from "@/lib/try-on-ai";
import { fileToPortraitDataUrl, loadLastPhoto, persistAnalysisPhoto, loadLastAnalysisId } from "@/lib/last-result";

const FEATURES: { id: StudioFeature; label: string }[] = [
  { id: "hair", label: "Hair" },
  { id: "eyes", label: "Eyes" },
  { id: "lips", label: "Lips" },
  { id: "cheeks", label: "Cheeks" },
  { id: "jewelry", label: "Jewelry" },
  { id: "dress", label: "Dress" },
];

const BRUSH_PRESETS = [
  { id: "fine", label: "Fine", size: 0.012 },
  { id: "small", label: "S", size: 0.024 },
  { id: "medium", label: "M", size: 0.042 },
  { id: "large", label: "L", size: 0.072 },
  { id: "xl", label: "XL", size: 0.12 },
] as const;

type BrushMode = "off" | "paint" | "erase";
type UndoEntry = { feature: StudioFeature; layer: Float32Array<ArrayBufferLike> };

type Props = {
  catalog: TryOnCatalog;
  seasonLabel: string;
  initialPhoto?: string | null;
};

function canvasPoint(canvas: HTMLCanvasElement, clientX: number, clientY: number) {
  const box = canvas.getBoundingClientRect();
  return {
    x: ((clientX - box.left) / box.width) * canvas.width,
    y: ((clientY - box.top) / box.height) * canvas.height,
  };
}

function brushRadius(canvas: HTMLCanvasElement, size: number) {
  return Math.max(2, Math.min(canvas.width, canvas.height) * size);
}

export function TryOnStudio({ catalog, seasonLabel, initialPhoto }: Props) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const painting = useRef(false);
  const lastPt = useRef<{ x: number; y: number } | null>(null);
  const working = useRef<TryOnMasks | null>(null);
  const lookRef = useRef<TryOnLook>(catalog.look);
  const strengthRef = useRef<TryOnStrength>(DEFAULT_STRENGTH);
  const enabledRef = useRef<TryOnEnabled>(DEFAULT_ENABLED);
  const wrapRef = useRef<HTMLDivElement>(null);
  const masksRef = useRef<TryOnMasks | null>(null);
  const [look, setLook] = useState<TryOnLook>(catalog.look);
  const [feature, setFeature] = useState<StudioFeature>("hair");
  const [masks, setMasks] = useState<TryOnMasks | null>(null);
  const [strength, setStrength] = useState<TryOnStrength>(DEFAULT_STRENGTH);
  const [enabled, setEnabled] = useState<TryOnEnabled>(DEFAULT_ENABLED);
  const [brush, setBrush] = useState<BrushMode>("off");
  const [brushSize, setBrushSize] = useState(0.042);
  const [hardness, setHardness] = useState(0.55);
  const [cursor, setCursor] = useState({ x: 0, y: 0, visible: false });
  const [undo, setUndo] = useState<UndoEntry[]>([]);
  const [redo, setRedo] = useState<UndoEntry[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Add a daylight face photo to apply real hair, makeup, jewelry, and dress color.");
  const [showOriginal, setShowOriginal] = useState(false);

  lookRef.current = look;
  strengthRef.current = strength;
  enabledRef.current = enabled;
  masksRef.current = masks;

  const activeOptions = catalog.options[feature];
  const featureLabel = FEATURES.find((f) => f.id === feature)?.label ?? "Color";

  const summary = useMemo(() => {
    const nameOf = (id: StudioFeature, hex: string) =>
      catalog.options[id].find((s) => s.hex.toLowerCase() === hex.toLowerCase())?.name ?? hex;
    return {
      hair: nameOf("hair", look.hair),
      eyes: nameOf("eyes", look.eyes),
      lips: nameOf("lips", look.lips),
    };
  }, [catalog, look]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (event.key === "Escape") {
        setUploadOpen(false);
        setAdjustOpen(false);
        setBrush("off");
      }
      if (event.key === "[") {
        event.preventDefault();
        setBrushSize((s) => Math.max(0.008, Number((s * 0.82).toFixed(3))));
      }
      if (event.key === "]") {
        event.preventDefault();
        setBrushSize((s) => Math.min(0.18, Number((s * 1.22).toFixed(3))));
      }
      if (event.key.toLowerCase() === "p") setBrush("paint");
      if (event.key.toLowerCase() === "e") setBrush("erase");
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redoStroke();
        else undoStroke();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !masks || painting.current) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    if (canvas.width !== masks.width) canvas.width = masks.width;
    if (canvas.height !== masks.height) canvas.height = masks.height;
    if (showOriginal) drawOriginal(ctx, masks);
    else renderTryOn(ctx, masks, look, strength, enabled);
  }, [look, masks, strength, enabled, showOriginal]);

  function preview(next: TryOnMasks) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    if (canvas.width !== next.width) canvas.width = next.width;
    if (canvas.height !== next.height) canvas.height = next.height;
    renderTryOn(ctx, next, lookRef.current, strengthRef.current, enabledRef.current);
  }

  function apply(hex: string, name: string) {
    setLook((current) => ({ ...current, [feature]: hex }));
    setEnabled((current) => ({ ...current, [feature]: true }));
    toast(`${featureLabel} → ${name}`);
  }

  function undoStroke() {
    const currentMasks = masksRef.current;
    setUndo((stack) => {
      if (!stack.length || !currentMasks) return stack;
      const last = stack[stack.length - 1];
      setRedo((r) => [...r, { feature: last.feature, layer: copyLayer(currentMasks, last.feature) }]);
      setMasks((current) => (current ? restoreLayer(current, last.feature, last.layer) : current));
      return stack.slice(0, -1);
    });
  }

  function redoStroke() {
    const currentMasks = masksRef.current;
    setRedo((stack) => {
      if (!stack.length || !currentMasks) return stack;
      const last = stack[stack.length - 1];
      setUndo((u) => [...u, { feature: last.feature, layer: copyLayer(currentMasks, last.feature) }]);
      setMasks((current) => (current ? restoreLayer(current, last.feature, last.layer) : current));
      return stack.slice(0, -1);
    });
  }

  function beginStroke(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas || !masks || brush === "off") return;
    const pt = canvasPoint(canvas, clientX, clientY);
    const next = cloneMasks(masks);
    setUndo((stack) => [...stack.slice(-14), { feature, layer: copyLayer(masks, feature) }]);
    setRedo([]);
    stampStrokeInPlace(next, feature, null, pt, brushRadius(canvas, brushSize), brush, hardness);
    working.current = next;
    lastPt.current = pt;
    painting.current = true;
    setEnabled((current) => ({ ...current, [feature]: true }));
    preview(next);
  }

  function moveStroke(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    const next = working.current;
    if (!canvas || !next || brush === "off" || !painting.current) return;
    const pt = canvasPoint(canvas, clientX, clientY);
    stampStrokeInPlace(next, feature, lastPt.current, pt, brushRadius(canvas, brushSize), brush, hardness);
    lastPt.current = pt;
    preview(next);
  }

  function endStroke() {
    if (!painting.current) return;
    painting.current = false;
    lastPt.current = null;
    if (working.current) setMasks(working.current);
    working.current = null;
  }

  function updateCursor(clientX: number, clientY: number, inside: boolean) {
    const wrap = wrapRef.current;
    if (!wrap || !inside) {
      setCursor((c) => (c.visible ? { ...c, visible: false } : c));
      return;
    }
    const box = wrap.getBoundingClientRect();
    setCursor({ x: clientX - box.left, y: clientY - box.top, visible: true });
  }

  async function applyPrepared(
    image: HTMLImageElement,
    canvas: HTMLCanvasElement,
    persistPhoto?: string,
    fromSaved = false,
  ) {
    setBusy(true);
    setStatus("Looking for a person's face…");
    try {
      const next = await buildTryOnMasks(image, canvas);
      setMasks(next);
      setUndo([]);
      setRedo([]);
      setUploadOpen(false);
      setShowOriginal(false);
      setBrush("paint");
      setStatus("Face found. Use Paint/Erase under the photo, then change size or undo if needed.");
      if (!fromSaved) toast("Photo ready");
      if (persistPhoto) void persistAnalysisPhoto(loadLastAnalysisId(), persistPhoto);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not analyze that photo";
      setStatus(message);
      setUploadOpen(true);
      toast(
        e instanceof NoFaceError || (e instanceof Error && e.name === "NoFaceError")
          ? "Please upload a photo of a person"
          : "Could not analyze that photo",
        "error",
      );
    } finally {
      if (fileRef.current) fileRef.current.value = "";
      setBusy(false);
    }
  }

  useEffect(() => {
    const saved = initialPhoto || loadLastPhoto();
    if (!saved) {
      setUploadOpen(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const { image, canvas } = await dataUrlToImage(saved);
        if (cancelled) return;
        await applyPrepared(image, canvas, undefined, true);
      } catch {
        if (!cancelled) setUploadOpen(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialPhoto]);

  async function onPhoto(file: File | null) {
    if (!file) return;
    try {
      const dataUrl = await fileToPortraitDataUrl(file);
      const { image, canvas } = await fileToImage(file);
      await applyPrepared(image, canvas, dataUrl);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not read that photo";
      setStatus(message);
      setUploadOpen(true);
      toast(message, "error");
    }
  }

  async function saveColor() {
    const name =
      catalog.options[feature].find((s) => s.hex.toLowerCase() === look[feature].toLowerCase())?.name ?? featureLabel;
    const res = await fetch("/api/wardrobe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ hex: look[feature], name, category: feature === "dress" ? "Clothing" : "Makeup" }),
    });
    if (!res.ok) {
      toast(res.status === 401 ? "Sign in to save colors." : "Could not save.", "error");
      return;
    }
    toast(`Saved ${name} to wardrobe`);
  }

  return (
    <div className="tryon-layout">
      <div className="tryon-stage">
        {masks ? (
          <>
            <div
              ref={wrapRef}
              className={`tryon-canvas-wrap ${brush !== "off" ? "tryon-canvas-brush" : ""}`}
              onPointerMove={(e) => updateCursor(e.clientX, e.clientY, true)}
              onPointerLeave={() => updateCursor(0, 0, false)}
            >
              <canvas
                ref={canvasRef}
                className="tryon-canvas"
                onPointerDown={(e) => {
                  if (brush === "off") return;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  beginStroke(e.clientX, e.clientY);
                }}
                onPointerMove={(e) => {
                  updateCursor(e.clientX, e.clientY, true);
                  if (!painting.current) return;
                  moveStroke(e.clientX, e.clientY);
                }}
                onPointerUp={endStroke}
                onPointerCancel={endStroke}
              />
              {brush !== "off" && cursor.visible && wrapRef.current ? (
                <span
                  className={`tryon-brush-ring tryon-brush-ring-${brush}`}
                  style={{
                    left: cursor.x,
                    top: cursor.y,
                    width: Math.max(
                      8,
                      brushSize * Math.min(wrapRef.current.clientWidth, wrapRef.current.clientHeight) * 2,
                    ),
                    height: Math.max(
                      8,
                      brushSize * Math.min(wrapRef.current.clientWidth, wrapRef.current.clientHeight) * 2,
                    ),
                  }}
                />
              ) : null}
            </div>
            <div className="tryon-brush-bar">
              <div className="chip-select">
                <button
                  type="button"
                  className={`chip-toggle ${brush === "off" ? "chip-toggle-on" : ""}`}
                  onClick={() => setBrush("off")}
                >
                  Move
                </button>
                <button
                  type="button"
                  className={`chip-toggle ${brush === "paint" ? "chip-toggle-on" : ""}`}
                  onClick={() => setBrush("paint")}
                >
                  Paint
                </button>
                <button
                  type="button"
                  className={`chip-toggle ${brush === "erase" ? "chip-toggle-on" : ""}`}
                  onClick={() => setBrush("erase")}
                >
                  Erase
                </button>
                <button type="button" className="chip-toggle" disabled={!undo.length} onClick={undoStroke}>
                  Undo
                </button>
                <button type="button" className="chip-toggle" disabled={!redo.length} onClick={redoStroke}>
                  Redo
                </button>
              </div>
              <div className="chip-select">
                {BRUSH_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={`chip-toggle ${Math.abs(brushSize - preset.size) < 0.004 ? "chip-toggle-on" : ""}`}
                    onClick={() => setBrushSize(preset.size)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <label className="tryon-brush-slider">
                Size {Math.round(brushSize * 100)}%
                <input
                  type="range"
                  min={0.008}
                  max={0.18}
                  step={0.002}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                />
              </label>
              <label className="tryon-brush-slider">
                Softness {Math.round((1 - hardness) * 100)}%
                <input
                  type="range"
                  min={0.08}
                  max={0.92}
                  step={0.02}
                  value={1 - hardness}
                  onChange={(e) => setHardness(1 - Number(e.target.value))}
                />
              </label>
              <p className="muted tryon-brush-hint">
                Drawing on {featureLabel.toLowerCase()}. [ and ] resize, P paint, E erase, Esc stops the brush.
              </p>
            </div>
          </>
        ) : (
          <button type="button" className="tryon-empty" onClick={() => setUploadOpen(true)}>
            <strong>Add a real photo</strong>
            <span>We’ll use the photo saved with this analysis when you have one. You can still change it.</span>
          </button>
        )}
        <p className="muted tryon-caption">
          {seasonLabel} · {summary.hair} · {summary.eyes} · {summary.lips}
        </p>
        <p className="muted tryon-caption">{status}</p>
      </div>

      <div className="tryon-controls">
        <div className="chip-select">
          {FEATURES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`chip-toggle ${feature === item.id ? "chip-toggle-on" : ""} ${enabled[item.id] ? "" : "chip-toggle-muted"}`}
              onClick={() => setFeature(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="tryon-swatches">
          {activeOptions.map((option) => (
            <button
              key={`${feature}-${option.hex}-${option.name}`}
              type="button"
              className={`tryon-swatch ${look[feature].toLowerCase() === option.hex.toLowerCase() && enabled[feature] ? "tryon-swatch-on" : ""}`}
              onClick={() => apply(option.hex, option.name)}
            >
              <span className="color-dot large" style={{ background: option.hex }} />
              <strong>{option.name}</strong>
              {option.recommended ? <span className="muted">Suggested</span> : <span className="muted">Palette</span>}
            </button>
          ))}
        </div>

        <label>
          Custom {feature} color
          <ColorField aria-label={`Custom ${feature} color`} value={look[feature]} onChange={(hex) => apply(hex, hex)} />
        </label>

        <div className="actions" style={{ marginTop: "1rem" }}>
          <button className="btn btn-primary" type="button" onClick={() => setUploadOpen(true)}>
            {masks ? "Change photo" : "Add photo"}
          </button>
          <button
            className={`btn ${enabled[feature] ? "btn-secondary" : "btn-primary"}`}
            type="button"
            disabled={!masks}
            onClick={() => {
              setEnabled((current) => ({ ...current, [feature]: !current[feature] }));
              toast(enabled[feature] ? `${featureLabel} color removed` : `${featureLabel} color restored`);
            }}
          >
            {enabled[feature] ? `Remove ${featureLabel.toLowerCase()}` : `Restore ${featureLabel.toLowerCase()}`}
          </button>
          <button className="btn btn-secondary" type="button" disabled={!masks} onClick={() => setAdjustOpen(true)}>
            Strength
          </button>
          <button
            className="btn btn-secondary"
            type="button"
            disabled={!masks}
            onMouseDown={() => setShowOriginal(true)}
            onMouseUp={() => setShowOriginal(false)}
            onMouseLeave={() => setShowOriginal(false)}
            onTouchStart={() => setShowOriginal(true)}
            onTouchEnd={() => setShowOriginal(false)}
          >
            Hold original
          </button>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => {
              setLook(catalog.look);
              setEnabled(DEFAULT_ENABLED);
              setStrength(DEFAULT_STRENGTH);
            }}
          >
            Reset colors
          </button>
          <button className="btn btn-secondary" type="button" onClick={() => void saveColor()}>
            Save {featureLabel.toLowerCase()} color
          </button>
        </div>
        <p className="muted" style={{ marginTop: "0.85rem" }}>
          First load downloads face and clothing models. Use the brush bar under the photo to paint or erase. Jewelry
          and dress stay off until you pick a color.
        </p>
      </div>

      {uploadOpen ? (
        <div className="tryon-modal-backdrop" onClick={() => !busy && setUploadOpen(false)}>
          <div
            className="tryon-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tryon-upload-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="tryon-upload-title">Add a face photo</h2>
            <p className="lead">
              {busy
                ? "Checking for a person's face, then mapping hair and makeup. This can take a few seconds the first time."
                : status.includes("couldn't find a person's face")
                  ? status
                  : "Upload a clear front-facing photo of a person. Pets, objects, and landscapes cannot be recolored."}
            </p>
            <label className="tryon-drop">
              <strong>{busy ? "Analyzing…" : "Choose photo"}</strong>
              <span>JPEG, PNG, or WebP</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                disabled={busy}
                onChange={(e) => void onPhoto(e.target.files?.[0] ?? null)}
              />
            </label>
            <div className="actions">
              <button className="btn btn-primary" type="button" disabled={busy} onClick={() => fileRef.current?.click()}>
                Browse files
              </button>
              <button className="btn btn-secondary" type="button" disabled={busy} onClick={() => setUploadOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {adjustOpen && masks ? (
        <div className="tryon-modal-backdrop" onClick={() => setAdjustOpen(false)}>
          <div
            className="tryon-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tryon-adjust-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="tryon-adjust-title">{featureLabel} strength</h2>
            <label>
              How strong the recolor is
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={strength[feature]}
                onChange={(e) => setStrength((s) => ({ ...s, [feature]: Number(e.target.value) }))}
              />
            </label>
            <div className="actions">
              <button className="btn btn-secondary" type="button" onClick={() => setStrength(DEFAULT_STRENGTH)}>
                Reset strength
              </button>
              <button className="btn btn-primary" type="button" onClick={() => setAdjustOpen(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
