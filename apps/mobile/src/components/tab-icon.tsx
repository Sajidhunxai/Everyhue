import Svg, { Circle, Path, Rect } from "react-native-svg";

export type TabIconName =
  | "dashboard"
  | "analyze"
  | "compare"
  | "shop"
  | "wardrobe"
  | "family"
  | "stylist"
  | "more"
  | "match"
  | "beauty"
  | "tryon"
  | "looks"
  | "history"
  | "quiz";

type Props = {
  name: TabIconName;
  color: string;
  size?: number;
};

export function TabIcon({ name, color, size = 24 }: Props) {
  const s = size;
  const stroke = color;
  const common = {
    stroke,
    strokeWidth: 1.85,
    fill: "none" as const,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "dashboard":
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Rect x="3.5" y="3.5" width="7" height="7" rx="1.5" {...common} />
          <Rect x="13.5" y="3.5" width="7" height="7" rx="1.5" {...common} />
          <Rect x="3.5" y="13.5" width="7" height="7" rx="1.5" {...common} />
          <Rect x="13.5" y="13.5" width="7" height="7" rx="1.5" {...common} />
        </Svg>
      );
    case "analyze":
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="7.5" {...common} />
          <Circle cx="12" cy="12" r="2.5" stroke={stroke} strokeWidth={1.85} fill={stroke} />
        </Svg>
      );
    case "compare":
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path d="M7 8h11M15 4l4 4-4 4" {...common} />
          <Path d="M17 16H6M9 12l-4 4 4 4" {...common} />
        </Svg>
      );
    case "shop":
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path d="M12 4.5 19 12l-7 7.5L5 12l7-7.5Z" {...common} />
        </Svg>
      );
    case "wardrobe":
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Rect x="5" y="4" width="14" height="16" rx="2" {...common} />
          <Path d="M12 4v16M9.5 12h0.01" {...common} />
        </Svg>
      );
    case "family":
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Circle cx="9" cy="9" r="3" {...common} />
          <Circle cx="16" cy="10" r="2.5" {...common} />
          <Path d="M4 19c0-2.8 2.2-5 5-5s5 2.2 5 5" {...common} />
          <Path d="M14 19c0-2 1.6-3.6 3.5-3.8" {...common} />
        </Svg>
      );
    case "stylist":
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path
            d="M12 3.5 13.2 9.2 19 10.5 13.2 11.8 12 17.5 10.8 11.8 5 10.5 10.8 9.2 12 3.5Z"
            {...common}
          />
          <Path d="M18 15.5 18.5 17.2 20.2 17.7 18.5 18.2 18 19.9 17.5 18.2 15.8 17.7 17.5 17.2 18 15.5Z" {...common} />
        </Svg>
      );
    case "match":
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Circle cx="9" cy="12" r="5.5" {...common} />
          <Circle cx="15" cy="12" r="5.5" {...common} />
        </Svg>
      );
    case "beauty":
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path d="M12 4c2.8 3.2 5 5.8 5 9a5 5 0 0 1-10 0c0-3.2 2.2-5.8 5-9Z" {...common} />
          <Path d="M9.5 14.5c.8.9 1.6 1.3 2.5 1.3s1.7-.4 2.5-1.3" {...common} />
        </Svg>
      );
    case "tryon":
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Rect x="4" y="5" width="16" height="14" rx="2" {...common} />
          <Circle cx="10" cy="12" r="2.2" {...common} />
          <Path d="M15 16.5c1.2-1.4 2.4-2.1 3.5-2.1" {...common} />
        </Svg>
      );
    case "looks":
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Rect x="4" y="4" width="7" height="16" rx="1.5" {...common} />
          <Rect x="13" y="4" width="7" height="10" rx="1.5" {...common} />
          <Path d="M13 17h7M13 20h5" {...common} />
        </Svg>
      );
    case "history":
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="8" {...common} />
          <Path d="M12 8v4.5l3 1.8" {...common} />
        </Svg>
      );
    case "quiz":
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="8" {...common} />
          <Path d="M9.6 9.4a2.6 2.6 0 0 1 4.8 1.2c0 1.5-1.5 2.1-2.4 2.7" {...common} />
          <Circle cx="12" cy="16.6" r="1" fill={stroke} />
        </Svg>
      );
    case "more":
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Circle cx="6" cy="12" r="1.7" fill={stroke} />
          <Circle cx="12" cy="12" r="1.7" fill={stroke} />
          <Circle cx="18" cy="12" r="1.7" fill={stroke} />
        </Svg>
      );
    default:
      return null;
  }
}
