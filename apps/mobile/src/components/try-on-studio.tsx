import type { TryOnCatalog, TryOnFeature, TryOnLook } from "@photomatcher/types";
import {
  Canvas,
  Group,
  Image,
  Path,
  Skia,
  useImage,
  type SkPath,
} from "@shopify/react-native-skia";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, type LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { AppButton } from "@/components/app-button";
import { AppChip } from "@/components/app-chip";
import { theme } from "@/lib/theme";
import { renderLookWithAi } from "@/lib/try-on-api";
import {
  DEFAULT_TRYON_ENABLED,
  loadPortraitPixels,
  renderPortraitLook,
  type PortraitPixels,
  type TryOnEnabled,
} from "@/lib/try-on-render";
import { type } from "@/lib/type";

const FEATURES: { id: TryOnFeature; label: string }[] = [
  { id: "hair", label: "Hair" },
  { id: "eyes", label: "Eyes" },
  { id: "lips", label: "Lips" },
  { id: "cheeks", label: "Cheeks" },
  { id: "jewelry", label: "Jewelry" },
  { id: "dress", label: "Dress" },
];

const BRUSH = [
  { id: "fine", label: "Fine", size: 10 },
  { id: "s", label: "S", size: 18 },
  { id: "m", label: "M", size: 32 },
  { id: "l", label: "L", size: 52 },
] as const;

type Stroke = {
  feature: TryOnFeature;
  path: SkPath;
  mode: "paint" | "erase";
  size: number;
};

type Props = {
  photoUri: string;
  catalog: TryOnCatalog;
  accessToken?: string | null;
};

export function TryOnStudio({ photoUri, catalog, accessToken }: Props) {
  const [look, setLook] = useState<TryOnLook>(catalog.look);
  const [enabled, setEnabled] = useState<TryOnEnabled>(DEFAULT_TRYON_ENABLED);
  const [feature, setFeature] = useState<TryOnFeature>("hair");
  const [mode, setMode] = useState<"paint" | "erase">("paint");
  const [brush, setBrush] = useState<(typeof BRUSH)[number]["id"]>("m");
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [draft, setDraft] = useState<Stroke | null>(null);
  const draftRef = useRef<Stroke | null>(null);
  const [box, setBox] = useState({ width: 1, height: 1 });
  const [portrait, setPortrait] = useState<PortraitPixels | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usedAi, setUsedAi] = useState(false);
  const renderId = useRef(0);
  const portraitRef = useRef<PortraitPixels | null>(null);

  const image = useImage(previewUri ?? photoUri.split("?")[0]);
  const brushSize = BRUSH.find((b) => b.id === brush)?.size ?? 32;
  const swatches = catalog.options[feature];

  useEffect(() => {
    let cancelled = false;
    setPortrait(null);
    portraitRef.current = null;
    void loadPortraitPixels(photoUri)
      .then((next) => {
        if (cancelled) return;
        setPortrait(next);
        portraitRef.current = next;
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [photoUri]);

  useEffect(() => {
    let cancelled = false;
    const stamp = ++renderId.current;
    const timer = setTimeout(() => {
      setBusy(true);
      setError(null);
      void (async () => {
        try {
          const local = portraitRef.current;
          if (local) {
            const uri = await renderPortraitLook(local, look, enabled, stamp);
            if (!cancelled && stamp === renderId.current) {
              setPreviewUri(uri);
              setUsedAi(false);
              setError(null);
              setBusy(false);
            }
          }
          if (!accessToken || cancelled || stamp !== renderId.current) return;
          try {
            const uri = await renderLookWithAi(accessToken, photoUri, look, enabled);
            if (!cancelled && stamp === renderId.current) {
              setPreviewUri(uri);
              setUsedAi(true);
            }
          } catch {
            /* Keep the free on-device look if cloud AI is unpaid or down. */
          }
        } catch (e) {
          if (!cancelled && stamp === renderId.current && e instanceof Error) setError(e.message);
        } finally {
          if (!cancelled && stamp === renderId.current) setBusy(false);
        }
      })();
    }, 700);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [accessToken, enabled, look, photoUri]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox({ width, height });
  };

  const canvasSize = useMemo(() => {
    const maxW = box.width || 1;
    if (portrait) return { width: maxW, height: maxW * (portrait.height / portrait.width) };
    if (!image) return { width: maxW, height: maxW * 1.25 };
    return { width: maxW, height: maxW * (image.height() / image.width()) };
  }, [box.width, image, portrait]);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .minDistance(0)
        .onBegin((e) => {
          const path = Skia.Path.Make();
          path.moveTo(e.x, e.y);
          path.lineTo(e.x + 0.4, e.y);
          const stroke: Stroke = { feature, path, mode, size: brushSize };
          draftRef.current = stroke;
          setDraft(stroke);
        })
        .onUpdate((e) => {
          const current = draftRef.current;
          if (!current) return;
          current.path.lineTo(e.x, e.y);
          const next = { ...current, path: current.path.copy() };
          draftRef.current = next;
          setDraft(next);
        })
        .onEnd(() => {
          const current = draftRef.current;
          draftRef.current = null;
          if (current) setStrokes((all) => [...all, current]);
          setDraft(null);
        }),
    [brushSize, feature, mode],
  );

  const allStrokes = draft ? [...strokes, draft] : strokes;

  return (
    <View style={styles.wrap}>
      <View style={styles.canvasWrap} onLayout={onLayout}>
        <GestureDetector gesture={gesture}>
          <Canvas style={{ width: canvasSize.width, height: canvasSize.height }}>
            {image ? (
              <Image
                image={image}
                x={0}
                y={0}
                width={canvasSize.width}
                height={canvasSize.height}
                fit="contain"
              />
            ) : null}
            {FEATURES.map((item) => {
              const featureStrokes = allStrokes.filter((stroke) => stroke.feature === item.id);
              if (!featureStrokes.length) return null;
              return (
                <Group key={item.id} layer blendMode="color">
                  {featureStrokes.map((stroke, index) => (
                    <Path
                      key={`${item.id}-${index}`}
                      path={stroke.path}
                      style="stroke"
                      strokeWidth={stroke.size}
                      strokeCap="round"
                      strokeJoin="round"
                      color={stroke.mode === "erase" ? "black" : look[item.id]}
                      blendMode={stroke.mode === "erase" ? "clear" : "srcOver"}
                    />
                  ))}
                </Group>
              );
            })}
          </Canvas>
        </GestureDetector>
        {busy ? (
          <View style={styles.loading}>
            <ActivityIndicator color={theme.primary} />
            <Text style={styles.loadingText}>AI is recoloring hair, eyes, lips, and clothes…</Text>
          </View>
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.hint}>
        {usedAi
          ? "Cloud AI recolored hair, eyes, lips, and clothes."
          : "Free on-device look: hair, eyes, lips, and clothes change when you pick a swatch. No paid API required."}
      </Text>

      <View style={styles.row}>
        {FEATURES.map((item) => (
          <AppChip
            key={item.id}
            selected={feature === item.id}
            onPress={() => {
              setFeature(item.id);
              setEnabled((current) => ({ ...current, [item.id]: true }));
            }}
          >
            {item.label}
          </AppChip>
        ))}
      </View>
      <View style={styles.row}>
        <AppChip
          selected={enabled[feature]}
          onPress={() => setEnabled((current) => ({ ...current, [feature]: !current[feature] }))}
        >
          {enabled[feature] ? `Hide ${feature}` : `Show ${feature}`}
        </AppChip>
      </View>

      <View style={styles.row}>
        <AppChip selected={mode === "paint"} onPress={() => setMode("paint")}>
          Paint
        </AppChip>
        <AppChip selected={mode === "erase"} onPress={() => setMode("erase")}>
          Erase
        </AppChip>
        {BRUSH.map((item) => (
          <AppChip key={item.id} selected={brush === item.id} onPress={() => setBrush(item.id)}>
            {item.label}
          </AppChip>
        ))}
      </View>

      <View style={styles.row}>
        {swatches.slice(0, 10).map((swatch) => (
          <AppChip
            key={`${swatch.hex}-${swatch.name}`}
            selected={look[feature].toUpperCase() === swatch.hex.toUpperCase()}
            colorDot={swatch.hex}
            onPress={() => setLook({ ...look, [feature]: swatch.hex })}
          >
            {swatch.recommended ? "Best" : swatch.name.split(" ")[0]}
          </AppChip>
        ))}
      </View>

      <AppButton
        variant="secondary"
        onPress={() => setStrokes((all) => all.slice(0, -1))}
        disabled={!strokes.length}
      >
        Undo stroke
      </AppButton>
      <AppButton variant="ghost" onPress={() => setStrokes([])} disabled={!strokes.length}>
        Clear paint
      </AppButton>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  canvasWrap: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.line,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(18,20,26,0.45)",
    gap: 8,
    padding: 16,
  },
  loadingText: { ...type.muted, textAlign: "center" },
  hint: { ...type.muted },
  error: { color: theme.danger, fontFamily: "Manrope_500Medium" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
