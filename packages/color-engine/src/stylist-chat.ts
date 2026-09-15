import type { StylistContext } from "@photomatcher/types";

type ChatTurn = { role: "user" | "assistant"; content: string };

const KEYWORDS: { pattern: RegExp; reply: (ctx: StylistContext, message: string) => string }[] = [
  {
    pattern: /^(hi|hello|hey|howdy|good (morning|afternoon|evening))\b/i,
    reply: (ctx) =>
      `Hi! I'm your ${ctx.seasonLabel} stylist. Your best colors include ${formatPalette(ctx, 4)}. Try asking: "What should I wear casually?", "Jewelry for my undertone?", or "Suit colors for work."`,
  },
  {
    pattern: /jewel|jewe|jewl|jwlry|ring|necklace|earring|bracelet|metal|gold|silver|platinum/i,
    reply: (ctx) => jewelryAdvice(ctx),
  },
  {
    pattern: /suit|blazer|formal|interview|business|office|work wear|corporate/i,
    reply: (ctx) =>
      `For ${ctx.seasonLabel} at work: build suits from ${formatNeutrals(ctx, 2)} and add one accent — ${ctx.palette[0]?.name ?? "a signature palette color"} works well for ties, pocket squares, or blouses. Keep contrast crisp; avoid muddy or dusty tones that flatten your coloring.`,
  },
  {
    pattern: /casual|weekend|everyday|daily|errands|lounge/i,
    reply: (ctx) =>
      `Casual for ${ctx.seasonLabel}: pair a neutral base (${formatNeutrals(ctx, 2)}) with a top in ${ctx.palette[1]?.name ?? ctx.palette[0]?.name ?? "a clear palette color"}. Denim is fine if the wash matches your ${ctx.undertone} undertone — steer clear of faded or yellowed washes that dull your face.`,
  },
  {
    pattern: /what.*wear|what should|outfit|clothes|clothing|dress me|recommend|style me|look good/i,
    reply: (ctx, message) => generalWearAdvice(ctx, message),
  },
  {
    pattern: /makeup|lip|blush|eye shadow|eyeshadow|foundation|concealer|cosmetic/i,
    reply: (ctx) =>
      `Makeup for ${ctx.seasonLabel} (${ctx.undertone} undertone): anchor lips and cheeks in ${formatPalette(ctx, 3)}. Match foundation to your jaw in daylight — not your hand. For eyes, use neutrals from your palette plus one deeper accent like ${ctx.palette[0]?.name ?? "your deepest seasonal shade"}.`,
  },
  {
    pattern: /hair|highlight|balayage|dye/i,
    reply: (ctx) =>
      `Hair color for ${ctx.seasonLabel}: stay in your ${ctx.undertone} family. Gloss or highlights can pull from ${formatPalette(ctx, 2)} — avoid tones that turn ashy or brassy against your skin.`,
  },
  {
    pattern: /avoid|never|wrong|bad color|doesn't suit|does not suit|wash me out/i,
    reply: (ctx) =>
      `For ${ctx.seasonLabel}, skip colors that mute your natural contrast — especially muddy browns, wrong undertones, and dusty pastels. If a shade makes you look tired or sallow, it's likely outside your range.`,
  },
  {
    pattern: /wedding|event|party|evening|gala|date night|dinner/i,
    reply: (ctx) =>
      `For an event as ${ctx.seasonLabel}: choose one hero color (${ctx.palette[0]?.name}) and keep the rest in ${formatNeutrals(ctx, 2)}. One statement color reads polished; too many brights can overwhelm your natural contrast.`,
  },
  {
    pattern: /coat|jacket|outerwear|winter|fall|summer|season/i,
    reply: (ctx) =>
      `Outerwear for ${ctx.seasonLabel}: invest in ${formatNeutrals(ctx, 2)} for coats and jackets — they frame your face daily. Add scarves or layers in ${ctx.palette[2]?.name ?? ctx.palette[0]?.name} for interest without clashing.`,
  },
  {
    pattern: /shoe|boot|sneaker|footwear/i,
    reply: (ctx) =>
      `Footwear: ${formatNeutrals(ctx, 2)} are your safest everyday bases. For ${ctx.seasonLabel}, leather in deep brown, black, or cool navy usually works better than pale or orange-tinted tan.`,
  },
  {
    pattern: /help|what can you|how do/i,
    reply: (ctx) =>
      `I can help with outfits, suits, casual wear, makeup, jewelry, hair color, events, and colors to avoid — all tailored to ${ctx.seasonLabel}. Your palette: ${formatPalette(ctx, 5)}.`,
  },
];

function formatPalette(ctx: StylistContext, n: number): string {
  return ctx.palette
    .slice(0, n)
    .map((p) => p.name)
    .join(", ");
}

function formatNeutrals(ctx: StylistContext, n: number): string {
  const list = ctx.neutrals.slice(0, n);
  return list.length ? list.join(" and ") : formatPalette(ctx, 2);
}

function jewelryAdvice(ctx: StylistContext): string {
  const metals =
    ctx.undertone === "warm"
      ? "yellow gold, bronze, and warm-toned stones"
      : "silver, platinum, white gold, and crisp cool stones";
  const stones = formatPalette(ctx, 3);
  return `For ${ctx.seasonLabel} (${ctx.undertone} undertone), lean toward ${metals}. Gemstone accents in ${stones} echo your palette beautifully. Avoid metals that look too yellow or too icy if they fight your undertone.`;
}

function generalWearAdvice(ctx: StylistContext, message: string): string {
  if (/work|office|job|interview/i.test(message)) {
    return `For ${ctx.seasonLabel} at work: build suits from ${formatNeutrals(ctx, 2)} and add one accent — ${ctx.palette[0]?.name ?? "a signature palette color"} works well for ties, pocket squares, or blouses. Keep contrast crisp.`;
  }
  if (/date|party|event|wedding|evening/i.test(message)) {
    return `For an event as ${ctx.seasonLabel}: choose one hero color (${ctx.palette[0]?.name}) and keep the rest in ${formatNeutrals(ctx, 2)}. One statement color reads polished.`;
  }
  if (/casual|weekend|everyday/i.test(message)) {
    return `Casual for ${ctx.seasonLabel}: pair a neutral base (${formatNeutrals(ctx, 2)}) with a top in ${ctx.palette[1]?.name ?? ctx.palette[0]?.name ?? "a clear palette color"}.`;
  }

  return `For ${ctx.seasonLabel}, start with neutrals (${formatNeutrals(ctx, 2)}) as your base, then add one or two colors from your palette: ${formatPalette(ctx, 4)}. Tell me the occasion — work, casual, or an event — and I'll get more specific.`;
}

export function stylistReply(message: string, ctx: StylistContext): string {
  const trimmed = message.trim();
  if (!trimmed) {
    return `Ask me anything about outfits for ${ctx.seasonLabel} — suits, casual wear, makeup, jewelry, or colors to avoid.`;
  }

  for (const { pattern, reply } of KEYWORDS) {
    if (pattern.test(trimmed)) return reply(ctx, trimmed);
  }

  return generalWearAdvice(ctx, trimmed);
}

export async function stylistReplyWithAi(
  message: string,
  ctx: StylistContext,
  apiKey: string,
  history: ChatTurn[] = [],
): Promise<string> {
  const system = `You are Every Hue stylist. User season: ${ctx.seasonLabel}, undertone: ${ctx.undertone}. Palette: ${ctx.palette.map((p) => `${p.name} (${p.hex})`).join(", ")}. Neutrals: ${ctx.neutrals.join(", ")}. Give concise, practical fashion advice. Reference their season and palette colors by name when relevant.`;
  const recent = history.slice(-8);
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        ...recent.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: message },
      ],
      max_tokens: 350,
      temperature: 0.7,
    }),
  });
  if (!res.ok) return stylistReply(message, ctx);
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() ?? stylistReply(message, ctx);
}
