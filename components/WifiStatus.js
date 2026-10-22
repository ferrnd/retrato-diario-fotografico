import { Ionicons } from "@expo/vector-icons";
import { NetworkStateType, useNetworkState } from "expo-network";
import { StyleSheet, Text, View } from "react-native";

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
        color={comWifi ? "#0f62fe" : "#627d98"}
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
    backgroundColor: "#d0e2ff",
  },
  semWifiFundo: {
    backgroundColor: "#e4ecf7",
  },
  texto: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f62fe",
  },
  semWifi: {
    color: "#627d98",
  },
});