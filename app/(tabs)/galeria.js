import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Image,
  LayoutAnimation,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BotaoAnimado from "../../components/BotaoAnimado";
import { useWifi } from "../../components/WifiStatus";
import { useFotos } from "../../contexts/FotosContext";

const DURACAO_SAIDA = 300;
const DURACAO_SEGURAR = 450;

// mostra o endereço, ou as coordenadas se não tiver
function textoLocal(item) {
  if (!item.local) return "Sem local";
  return (
    item.local.lugar ||
    `${item.local.latitude.toFixed(5)}, ${item.local.longitude.toFixed(5)}`
  );
}

function ItemFoto({ item, index, marcada, apagando, onTocar, onSegurar }) {
  const entrada = useRef(new Animated.Value(0)).current;
  const pressao = useRef(new Animated.Value(0)).current;
  const selecao = useRef(new Animated.Value(0)).current;
  const tremor = useRef(new Animated.Value(0)).current;
  const saida = useRef(new Animated.Value(0)).current;
  const loopTremor = useRef(null);

  useEffect(() => {
    Animated.timing(entrada, {
      toValue: 1,
      duration: 350,
      delay: Math.min(index, 8) * 70,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    Animated.spring(selecao, {
      toValue: marcada ? 1 : 0,
      friction: 5,
      tension: 160,
      useNativeDriver: true,
    }).start();
  }, [marcada]);

  useEffect(() => {
    if (marcada) {
      // tempo diferente em cada foto pra não tremerem todas juntas
      const meio = 140 + (index % 3) * 20;
      loopTremor.current = Animated.loop(
        Animated.sequence([
          Animated.timing(tremor, { toValue: 1, duration: meio, useNativeDriver: true }),
          Animated.timing(tremor, { toValue: -1, duration: meio * 2, useNativeDriver: true }),
          Animated.timing(tremor, { toValue: 0, duration: meio, useNativeDriver: true }),
        ])
      );
      loopTremor.current.start();
    } else {
      loopTremor.current?.stop();
      Animated.spring(tremor, { toValue: 0, useNativeDriver: true }).start();
    }
    return () => loopTremor.current?.stop();
  }, [marcada]);

  useEffect(() => {
    if (apagando && marcada) {
      Animated.timing(saida, {
        toValue: 1,
        duration: DURACAO_SAIDA,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  }, [apagando]);

  function aoPressionar() {
    Animated.timing(pressao, {
      toValue: 1,
      duration: DURACAO_SEGURAR,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }

  function aoSoltar() {
    Animated.spring(pressao, {
      toValue: 0,
      friction: 5,
      tension: 200,
      useNativeDriver: true,
    }).start();
  }

  const opacidadeCard = Animated.multiply(
    entrada,
    saida.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })
  );

  return (
    <Animated.View
      style={[
        styles.item,
        {
          opacity: opacidadeCard,
          transform: [
            { translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
            { translateY: saida.interpolate({ inputRange: [0, 1], outputRange: [0, 12] }) },
            { scale: saida.interpolate({ inputRange: [0, 1], outputRange: [1, 0.6] }) },
            { rotate: tremor.interpolate({ inputRange: [-1, 1], outputRange: ["-0.6deg", "0.6deg"] }) },
            { rotate: saida.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "8deg"] }) },
          ],
        },
      ]}
    >
      <Pressable
        onPress={() => onTocar(item)}
        onLongPress={() => onSegurar(item)}
        delayLongPress={DURACAO_SEGURAR}
        onPressIn={aoPressionar}
        onPressOut={aoSoltar}
      >

        <Animated.View
          style={{
            transform: [
              { scale: pressao.interpolate({ inputRange: [0, 1], outputRange: [1, 0.94] }) },
            ],
          }}
        >

          <Animated.View
            style={{
              transform: [
                { scale: selecao.interpolate({ inputRange: [0, 1], outputRange: [1, 0.88] }) },
              ],
            }}
          >
            <Image source={{ uri: item.uri }} style={styles.foto} />

            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                styles.escurecer,
                { opacity: pressao.interpolate({ inputRange: [0, 1], outputRange: [0, 0.3] }) },
              ]}
            />
            <Animated.View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, styles.realce, { opacity: selecao }]}
            />
          </Animated.View>
        </Animated.View>
      </Pressable>

      <View style={styles.info}>
        <Ionicons name="calendar-outline" size={13} color="#627d98" />
        <Text style={styles.infoTexto} numberOfLines={1}>
          {item.data}
        </Text>
      </View>
      <View style={styles.info}>
        <Ionicons name="location-outline" size={13} color="#627d98" />
        <Text style={styles.infoTexto} numberOfLines={1}>
          {textoLocal(item)}
        </Text>
      </View>
    </Animated.View>
  );
}

function BarraSelecao({ visivel, quantidade, onCancelar, onApagar }) {
  const anim = useRef(new Animated.Value(0)).current;
  const pulo = useRef(new Animated.Value(1)).current;
  const ultima = useRef(quantidade);
  if (quantidade > 0) ultima.current = quantidade;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visivel ? 1 : 0,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // height não funciona com native driver
    }).start();
  }, [visivel]);

  useEffect(() => {
    if (quantidade > 0) {
      Animated.sequence([
        Animated.timing(pulo, { toValue: 1.35, duration: 90, useNativeDriver: true }),
        Animated.spring(pulo, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]).start();
    }
  }, [quantidade]);

  return (
    <Animated.View
      style={[
        styles.barraBox,
        {
          height: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 56] }),
          opacity: anim,
        },
      ]}
    >
      <View style={styles.barra}>
        <BotaoAnimado onPress={onCancelar}>
          <Ionicons name="close" size={26} color="#102542" />
        </BotaoAnimado>

        <Animated.Text style={[styles.barraTexto, { transform: [{ scale: pulo }] }]}>
          {ultima.current} selecionada{ultima.current > 1 ? "s" : ""}
        </Animated.Text>

        <Animated.View
          style={{ transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] }}
        >
          <BotaoAnimado onPress={onApagar}>
            <Ionicons name="trash" size={26} color="#d92d20" />
          </BotaoAnimado>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

function Vazio() {
  const anim = useRef(new Animated.Value(0)).current;
  const flutuar = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(flutuar, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(flutuar, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.vazioBox,
        {
          opacity: anim,
          transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
        },
      ]}
    >
      <Animated.View
        style={{ transform: [{ translateY: flutuar.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }] }}
      >
        <Ionicons name="images-outline" size={64} color="#9fb3c8" />
      </Animated.View>
      <Text style={styles.vazio}>Nenhuma foto ainda.{"\n"}Tire uma na aba Câmera.</Text>
    </Animated.View>
  );
}

export default function GaleriaScreen() {
  const { fotos, removerFotos } = useFotos();
  const comWifi = useWifi();
  const [selecionada, setSelecionada] = useState(null);
  const [marcadas, setMarcadas] = useState([]);
  const [apagando, setApagando] = useState(false);
  const animacao = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);

  const emSelecao = marcadas.length > 0;

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (selecionada) {
      animacao.setValue(0);
      Animated.spring(animacao, {
        toValue: 1,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  }, [selecionada]);

  function fechar() {
    Animated.timing(animacao, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => setSelecionada(null));
  }

  function alternar(uri) {
    setMarcadas((atuais) =>
      atuais.includes(uri) ? atuais.filter((u) => u !== uri) : [...atuais, uri]
    );
  }

  function tocar(item) {
    if (apagando) return;
    if (emSelecao) {
      alternar(item.uri);
    } else {
      setSelecionada(item);
    }
  }

  function segurar(item) {
    if (apagando) return;
    if (!marcadas.includes(item.uri)) {
      setMarcadas((atuais) => [...atuais, item.uri]);
    }
  }

  function apagarMarcadas() {
    if (apagando) return;
    setApagando(true);
    // espera a animação de saída antes de remover
    timer.current = setTimeout(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      removerFotos(marcadas);
      setMarcadas([]);
      setApagando(false);
    }, DURACAO_SAIDA + 40);
  }

  function cancelarSelecao() {
    if (!apagando) setMarcadas([]);
  }

  // envio simulado, não manda pra lugar nenhum
  function enviarParaNuvem() {
    Alert.alert("Enviado", `${fotos.length} foto(s) enviada(s) para a nuvem (simulado).`);
  }

  // só envia com wi-fi e com pelo menos uma foto
  const podeEnviar = comWifi && fotos.length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <BarraSelecao
        visivel={emSelecao}
        quantidade={marcadas.length}
        onCancelar={cancelarSelecao}
        onApagar={apagarMarcadas}
      />

      <FlatList
        data={fotos}
        extraData={[marcadas, apagando]}
        keyExtractor={(foto) => foto.uri}
        numColumns={2}
        columnWrapperStyle={styles.coluna}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={<Vazio />}
        renderItem={({ item, index }) => (
          <ItemFoto
            item={item}
            index={index}
            marcada={marcadas.includes(item.uri)}
            apagando={apagando}
            onTocar={tocar}
            onSegurar={segurar}
          />
        )}
      />

      <View style={styles.rodape}>
        <BotaoAnimado
          style={[styles.button, !podeEnviar && styles.desabilitado]}
          onPress={enviarParaNuvem}
          disabled={!podeEnviar}
        >
          <Ionicons
            name={comWifi ? "cloud-upload-outline" : "cloud-offline-outline"}
            size={22}
            color="#ffffff"
          />
          <Text style={styles.buttonText}>
            {comWifi ? "Enviar para a nuvem" : "Conecte ao Wi-Fi para enviar"}
          </Text>
        </BotaoAnimado>
      </View>

      <Modal
        visible={selecionada !== null}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={fechar}
      >
        <Pressable style={styles.fundo} onPress={fechar}>
          {selecionada && (
            <Animated.View
              style={[
                styles.ampliada,
                {
                  opacity: animacao,
                  transform: [
                    {
                      scale: animacao.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.7, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Image source={{ uri: selecionada.uri }} style={styles.fotoGrande} />
              <Text style={styles.dataGrande}>{selecionada.data}</Text>
              <Text style={styles.dataGrande}>{textoLocal(selecionada)}</Text>
            </Animated.View>
          )}
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fbff",
  },
  barraBox: {
    overflow: "hidden",
    backgroundColor: "#d0e2ff",
  },
  barra: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  barraTexto: {
    fontSize: 16,
    fontWeight: "700",
    color: "#102542",
  },
  lista: {
    padding: 20,
    gap: 16,
    flexGrow: 1,
  },
  coluna: {
    justifyContent: "space-between",
  },
  item: {
    width: "48%",
    padding: 8,
    gap: 6,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    shadowColor: "#102542",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  foto: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 14,
    backgroundColor: "#d0e2ff",
  },
  escurecer: {
    borderRadius: 14,
    backgroundColor: "#102542",
  },
  realce: {
    borderRadius: 14,
    borderWidth: 3,
    borderColor: "#0f62fe",
    backgroundColor: "rgba(15, 98, 254, 0.18)",
  },
  info: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 4,
  },
  infoTexto: {
    flex: 1,
    fontSize: 12,
    color: "#334e68",
  },
  vazioBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 80,
  },
  vazio: {
    fontSize: 16,
    lineHeight: 24,
    color: "#627d98",
    textAlign: "center",
  },
  rodape: {
    padding: 20,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: "#102542",
  },
  desabilitado: {
    backgroundColor: "#9fb3c8",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  fundo: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16, 37, 66, 0.88)",
  },
  ampliada: {
    width: "88%",
    gap: 8,
  },
  fotoGrande: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 20,
    backgroundColor: "#d0e2ff",
  },
  dataGrande: {
    fontSize: 14,
    color: "#ffffff",
    textAlign: "center",
  },
});