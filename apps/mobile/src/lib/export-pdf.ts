import type { AnalyzeResult } from "@photomatcher/types";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildHtml(result: AnalyzeResult): string {
  const guide = result.styleGuide;
  const palette = result.palette
    .map((s) => `<li><span style="background:${s.hex}">&nbsp;</span> ${escapeHtml(s.name)}</li>`)
    .join("");
  const tips = result.tips.map((t) => `<li>${escapeHtml(t)}</li>`).join("");
  const suits = guide?.suits.map((t) => `<li>${escapeHtml(t)}</li>`).join("") ?? "";
  const faceBody = result.faceBodyTips
    ? `<h2>Face &amp; body</h2><p>Face: ${result.faceBodyTips.faceShape} · Body: ${result.faceBodyTips.bodyType}</p>`
    : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
body{font-family:system-ui,sans-serif;padding:24px;color:#12141a;background:#f5f3f0}
h1{margin:0 0 8px}h2{margin-top:20px}li{margin:4px 0}span{display:inline-block;width:14px;height:14px;border-radius:4px;margin-right:6px;vertical-align:middle}
.muted{color:#666;font-size:12px;margin-top:24px}
</style></head><body>
<h1>Every Hue Style Card</h1>
<h2>${escapeHtml(result.seasonLabel)}</h2>
<p>Undertone: ${escapeHtml(result.undertone)} · Confidence ${Math.round(result.confidence * 100)}%</p>
${faceBody}
<h2>Palette</h2><ul>${palette}</ul>
<h2>Suits &amp; formal</h2><ul>${suits}</ul>
<h2>Quick tips</h2><ul>${tips}</ul>
<p class="muted">Engine ${escapeHtml(result.engine_version)} · Every Hue</p>
</body></html>`;
}

export async function exportResultPdf(result: AnalyzeResult): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html: buildHtml(result) });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Share style card" });
  } else {
    await Print.printAsync({ uri });
  }
}
