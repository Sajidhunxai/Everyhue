import Svg, { Circle, Path, Rect } from "react-native-svg";

type Props = {
  name:
    | "dashboard"
    | "analyze"
    | "compare"
    | "shop"
    | "wardrobe"
    | "family"
    | "stylist";
  color: string;
  size?: number;
};

export function TabIcon({ name, color, size = 22 }: Props) {
  const s = size;
  const stroke = color;
  const common = {
    stroke,
    strokeWidth: 1.75,
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
          <Circle cx="12" cy="12" r="2.5" stroke={stroke} strokeWidth={1.75} fill={stroke} />
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
    default:
      return null;
  }
}
