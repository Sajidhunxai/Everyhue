import { Tabs } from "expo-router";
import { BrandLogo } from "@/components/brand-logo";
import { TabIcon } from "@/components/tab-icon";
import { theme } from "@/lib/theme";

export const unstable_settings = {
  initialRouteName: "index",
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.bg },
        headerTintColor: theme.ink,
        headerTitle: () => <BrandLogo variant="full" size="sm" />,
        headerTitleAlign: "center",
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: theme.bg },
        tabBarLabelStyle: { fontFamily: "Manrope_600SemiBold", fontSize: 11 },
        tabBarStyle: {
          backgroundColor: theme.bg,
          borderTopColor: theme.line,
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarIconStyle: { marginTop: 2 },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.muted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <TabIcon name="dashboard" color={color} size={26} />,
        }}
      />
      <Tabs.Screen
        name="analyze"
        options={{
          title: "Analyze",
          tabBarIcon: ({ color }) => <TabIcon name="analyze" color={color} size={26} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: "Shop",
          tabBarIcon: ({ color }) => <TabIcon name="shop" color={color} size={26} />,
        }}
      />
      <Tabs.Screen
        name="wardrobe"
        options={{
          title: "Wardrobe",
          tabBarIcon: ({ color }) => <TabIcon name="wardrobe" color={color} size={26} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color }) => <TabIcon name="more" color={color} size={26} />,
        }}
      />
      <Tabs.Screen name="compare" options={{ href: null, title: "Compare" }} />
      <Tabs.Screen name="profiles" options={{ href: null, title: "Family" }} />
      <Tabs.Screen name="stylist" options={{ href: null, title: "Stylist" }} />
    </Tabs>
  );
}
