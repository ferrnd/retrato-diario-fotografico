import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import { CameraView, useCameraPermissions } from "expo-camera";
import { File } from "expo-file-system";
import * as Location from "expo-location";
import { Accelerometer } from "expo-sensors";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Linking,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BotaoAnimado from "../../components/BotaoAnimado";
import { useFotos } from "../../contexts/FotosContext";

// abaixo disso consideramos o celular parado
const LIMITE_MOVIMENTO = 0.08;

export default function CameraScreen() {
  const [permissao, pedirPermissao] = useCameraPermissions();
  const [permLocal, pedirLocal] = Location.useForegroundPermissions();
  const [lado, setLado] = useState("back");
  const [ocupado, setOcupado] = useState(false);
  const [parado, setParado] = useState(true);
  const [flashLigado, setFlashLigado] = useState(false);
  const [zoom, setZoom] = useState(0);
  const camera = useRef(null);
  const flash = useRef(new Animated.Value(0)).current;
  const giro = useRef(new Animated.Value(0)).current;
  const voltas = useRef(0);
  const { fotos, adicionarFoto } = useFotos();
  const ultimaFoto = fotos[0];

  const somObturador = useAudioPlayer(require("../../assets/obturador.mp3"));

  // zoom com pinça: compara a distância entre os dois dedos
  const zoomAtual = useRef(0);
  const pinca = useRef({ distancia: 0, zoom: 0 });
  const gestoZoom = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (e) => e.nativeEvent.touches.length === 2,
      onMoveShouldSetPanResponder: (e) => e.nativeEvent.touches.length === 2,
      onPanResponderMove: (e) => {
        const toques = e.nativeEvent.touches;
        if (toques.length !== 2) return;
        const distancia = Math.hypot(
          toques[0].pageX - toques[1].pageX,
          toques[0].pageY - toques[1].pageY
        );
        if (!pinca.current.distancia) {
          pinca.current = { distancia, zoom: zoomAtual.current };
          return;
        }
        const novo = pinca.current.zoom + (distancia - pinca.current.distancia) / 400;
        zoomAtual.current = Math.min(1, Math.max(0, novo));
        setZoom(zoomAtual.current);
      },
      onPanResponderRelease: () => {
        pinca.current.distancia = 0;
      },
      onPanResponderTerminate: () => {
        pinca.current.distancia = 0;
      },
    })
  ).current;

  useEffect(() => {
    let anterior = null;
    let suave = 0;
    let estado = true;

    // lê o acelerômetro a cada 100ms
    Accelerometer.setUpdateInterval(100);

    const assinatura = Accelerometer.addListener(({ x, y, z }) => {
      if (anterior) {
        // quanto mudou desde a última leitura
        const mudanca =
          Math.abs(x - anterior.x) +
          Math.abs(y - anterior.y) +
          Math.abs(z - anterior.z);

        // média pra não ficar piscando com qualquer tremidinha
        suave = suave * 0.6 + mudanca * 0.4;

        const novoEstado = suave < LIMITE_MOVIMENTO;

        // só atualiza o estado quando muda, pra não renderizar toda hora
        if (novoEstado !== estado) {
          estado = novoEstado;
          setParado(novoEstado);
        }
      }
      anterior = { x, y, z };
    });

    return () => assinatura.remove();
  }, []);

  // negou e marcou pra não perguntar de novo
  const localNegado = permLocal && !permLocal.granted && !permLocal.canAskAgain;

  // permissão ainda carregando
  if (!permissao) {
    return <SafeAreaView style={styles.safeArea} />;
  }

  // sem permissão: pede de novo ou manda pras configurações
  if (!permissao.granted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centro}>
          <View style={styles.iconeGrande}>
            <Ionicons name="camera-outline" size={44} color="#9A2E22" />
          </View>
          <Text style={styles.title}>Precisamos da câmera</Text>
          <Text style={styles.description}>
            {permissao.canAskAgain
              ? "O app usa a câmera para registrar os equipamentos do laboratório."
              : "A permissão foi negada. Ative a câmera nas configurações do celular."}
          </Text>
          <BotaoAnimado
            style={styles.button}
            onPress={() =>
              permissao.canAskAgain ? pedirPermissao() : Linking.openSettings()
            }
          >
            <Text style={styles.buttonText}>
              {permissao.canAskAgain ? "Permitir câmera" : "Abrir configurações"}
            </Text>
          </BotaoAnimado>
        </View>
      </SafeAreaView>
    );
  }

  async function tirarFoto() {
    // não tira se já estiver tirando ou se o celular estiver mexendo
    if (ocupado || !parado) return;
    setOcupado(true);

    // volta o som pro início antes de tocar
    somObturador.seekTo(0);
    somObturador.play();

    Animated.sequence([
      Animated.timing(flash, { toValue: 0.85, duration: 70, useNativeDriver: true }),
      Animated.timing(flash, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();

    try {
      // desliga o som do sistema, já usamos o nosso
      const resultado = await camera.current.takePictureAsync({
        shutterSound: false,
      });

      // geotag: só pega o local se a permissão foi dada
      let local = null;
      if (permLocal?.granted) {
        try {
          const posicao = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const latitude = posicao.coords.latitude;
          const longitude = posicao.coords.longitude;

          // tenta transformar as coordenadas em endereço
          let lugar = null;
          try {
            const [endereco] = await Location.reverseGeocodeAsync({
              latitude,
              longitude,
            });
            const rua = [endereco.street, endereco.streetNumber]
              .filter(Boolean)
              .join(", ");
            const cidade = endereco.city || endereco.subregion;
            lugar = [rua, cidade, endereco.country].filter(Boolean).join(", ");
          } catch (erro) {
            // sem internet não tem endereço, fica só com as coordenadas
            lugar = null;
          }

          local = { latitude, longitude, lugar };
        } catch (erro) {
          local = null;
        }
      }

      // tamanho do arquivo em bytes
      let tamanho = null;
      try {
        tamanho = new File(resultado.uri).size;
      } catch (erro) {
        tamanho = null;
      }

      adicionarFoto(
        {
          uri: resultado.uri,
          tamanho,
        },
        local
      );
    } finally {
      setOcupado(false);
    }
  }

  function voltarZoom() {
    zoomAtual.current = 0;
    setZoom(0);
  }

  function virarCamera() {
    setLado(lado === "back" ? "front" : "back");
    voltas.current += 1;
    Animated.timing(giro, {
      toValue: voltas.current,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.cameraBox}>
          <View style={StyleSheet.absoluteFill} {...gestoZoom.panHandlers}>
            <CameraView
              ref={camera}
              facing={lado}
              flash={flashLigado ? "on" : "off"}
              zoom={zoom}
              style={StyleSheet.absoluteFill}
            />
          </View>

          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, styles.flash, { opacity: flash }]}
          />

          <Pressable
            style={styles.chip}
            disabled={permLocal?.granted}
            onPress={() => (localNegado ? Linking.openSettings() : pedirLocal())}
          >
            <Ionicons
              name={permLocal?.granted ? "location" : "location-outline"}
              size={16}
              color={permLocal?.granted ? "#34d399" : "#EAE4D6"}
            />
            <Text style={styles.chipTexto}>
              {permLocal?.granted
                ? "Local ativo"
                : localNegado
                ? "Localização negada · abrir configurações"
                : "Permitir localização"}
            </Text>
          </Pressable>

          <View style={[styles.chip, styles.chipEstabilidade]}>
            <Ionicons
              name={parado ? "checkmark-circle" : "alert-circle"}
              size={16}
              color={parado ? "#34d399" : "#fbbf24"}
            />
            <Text style={styles.chipTexto}>
              {parado ? "Celular parado" : "Segure firme"}
            </Text>
          </View>

          <BotaoAnimado
            style={[styles.botaoVidro, styles.botaoFlash]}
            onPress={() => setFlashLigado(!flashLigado)}
          >
            <Ionicons
              name={flashLigado ? "flash" : "flash-off"}
              size={22}
              color={flashLigado ? "#fbbf24" : "#EAE4D6"}
            />
          </BotaoAnimado>

          {zoom > 0 && (
            <Pressable style={styles.zoomChip} onPress={voltarZoom}>
              <Text style={styles.chipTexto}>
                Zoom {Math.round(zoom * 100)}% · tocar para voltar
              </Text>
            </Pressable>
          )}

          <View style={styles.controles}>
            {ultimaFoto ? (
              <Image source={{ uri: ultimaFoto.uri }} style={styles.miniatura} />
            ) : (
              <View style={[styles.miniatura, styles.miniaturaVazia]} />
            )}

            <BotaoAnimado
              style={[styles.obturador, !parado && styles.obturadorBloqueado]}
              onPress={tirarFoto}
              disabled={!parado}
            >
              <View style={[styles.obturadorMiolo, ocupado && styles.obturadorOcupado]} />
            </BotaoAnimado>

            <BotaoAnimado style={styles.botaoVidro} onPress={virarCamera}>
              <Animated.View
                style={{
                  transform: [
                    {
                      rotate: giro.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "180deg"],
                      }),
                    },
                  ],
                }}
              >
                <Ionicons name="camera-reverse-outline" size={26} color="#EAE4D6" />
              </Animated.View>
            </BotaoAnimado>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#9A2E22",
  },
  container: {
    flex: 1,
    padding: 20,
  },
  centro: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    gap: 16,
  },
  iconeGrande: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAE4D6",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#EAE4D6",
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#EAE4D6",
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#3B0F0B",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#EAE4D6",
  },
  cameraBox: {
    flex: 1,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#3B0F0B",
  },
  flash: {
    backgroundColor: "#ffffff",
  },
  chip: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(59, 15, 11, 0.7)",
  },
  chipEstabilidade: {
    top: 58,
  },
  chipTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: "#EAE4D6",
  },
  controles: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  miniatura: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#EAE4D6",
  },
  miniaturaVazia: {
    backgroundColor: "rgba(59, 15, 11, 0.45)",
  },
  obturador: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: "#EAE4D6",
    alignItems: "center",
    justifyContent: "center",
  },
  obturadorBloqueado: {
    opacity: 0.35,
  },
  obturadorMiolo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#EAE4D6",
  },
  obturadorOcupado: {
    opacity: 0.5,
  },
  botaoFlash: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  zoomChip: {
    position: "absolute",
    alignSelf: "center",
    bottom: 110,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(59, 15, 11, 0.7)",
  },
  botaoVidro: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59, 15, 11, 0.55)",
  },
});