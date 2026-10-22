import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import WifiStatus from "../../components/WifiStatus";
import { FotosProvider } from "../../contexts/FotosContext";

export default function TabsLayout() {
  return (
    <FotosProvider>
      {/* o provider fica por fora pra câmera e galeria verem as mesmas fotos */}
      <Tabs
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#9A2E22" },
          headerTitleStyle: { fontWeight: "800", color: "#EAE4D6" },
          // status do wi-fi aparece em todas as telas
          headerRight: () => <WifiStatus />,
          tabBarActiveTintColor: "#9A2E22",
          tabBarInactiveTintColor: "#B8A99A",
          tabBarStyle: { backgroundColor: "#EAE4D6", borderTopColor: "#C9BFAE" },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Câmera",
            headerTitle: "Diário Fotográfico",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "camera" : "camera-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="galeria"
          options={{
            title: "Galeria",
            headerTitle: "Fotos",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "images" : "images-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </FotosProvider>
  );
}