import { Ionicons } from "@expo/vector-icons";
import { NetworkStateType, useNetworkState } from "expo-network";
import { StyleSheet, Text, View } from "react-native";

// true só se estiver no wi-fi (dados móveis não conta)
export function useWifi() {
  const rede = useNetworkState();
  return rede.type === NetworkStateType.WIFI && rede.isConnected === true;
}

export default function WifiStatus() {
  const comWifi = useWifi();

  return (
    <View style={[styles.container, !comWifi && styles.semWifiFundo]}>
      <Ionicons
        name={comWifi ? "wifi" : "cloud-offline-outline"}
        size={16}
        color={comWifi ? "#9A2E22" : "#3B0F0B"}
      />
      <Text style={[styles.texto, !comWifi && styles.semWifi]}>
        {comWifi ? "Wi-Fi" : "Sem Wi-Fi"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginRight: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#EAE4D6",
  },
  semWifiFundo: {
    backgroundColor: "#C9BFAE",
  },
  texto: {
    fontSize: 13,
    fontWeight: "700",
    color: "#9A2E22",
  },
  semWifi: {
    color: "#3B0F0B",
  },
});