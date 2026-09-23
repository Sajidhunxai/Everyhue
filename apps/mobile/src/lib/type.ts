import { theme } from "@/lib/theme";

export const fonts = {
  display: "Fraunces_600SemiBold",
  body: "Manrope_400Regular",
  medium: "Manrope_500Medium",
  semibold: "Manrope_600SemiBold",
  bold: "Manrope_700Bold",
} as const;

export const type = {
  kicker: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: "uppercase" as const,
    color: theme.primary,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 36,
    color: theme.ink,
  },
  lead: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 24,
    color: theme.muted,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: theme.ink,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: theme.ink,
  },
  muted: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 20,
    color: theme.muted,
  },
  button: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  chip: {
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
};
