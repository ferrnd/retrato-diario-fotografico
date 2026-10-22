import { useRef } from "react";
import { Animated, Pressable } from "react-native";

export default function BotaoAnimado({
  children,
  style,
  onPress,
  onLongPress,
  disabled,
}) {
  const escala = useRef(new Animated.Value(1)).current;

  function animar(valor) {
    Animated.spring(escala, {
      toValue: valor,
      friction: 6,
      tension: 200,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      onPressIn={() => animar(0.94)}
      onPressOut={() => animar(1)}
    >
      <Animated.View style={[style, { transform: [{ scale: escala }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}