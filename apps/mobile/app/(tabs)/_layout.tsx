import { Tabs } from "expo-router";
import { BrandLogo } from "@/components/brand-logo";
import { TabIcon } from "@/components/tab-icon";
import { theme } from "@/lib/theme";

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
        tabBarStyle: { backgroundColor: theme.bg, borderTopColor: theme.line },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.muted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="dashboard" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="analyze"
        options={{
          title: "Analyze",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="analyze" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="compare"
        options={{
          title: "Compare",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="compare" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: "Shop",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="shop" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="wardrobe"
        options={{
          title: "Wardrobe",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="wardrobe" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profiles"
        options={{
          title: "Family",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="family" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="stylist"
        options={{
          title: "Stylist",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="stylist" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
