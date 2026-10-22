# Retratô — Diário Fotográfico

App da Equipe 5 (tema: Câmera) feito com Expo. Serve como álbum do laboratório: cada foto fica salva com data, hora e local.

## O que o app faz

- Pré-visualização da câmera, captura e troca entre frontal e traseira
- Galeria com miniaturas, data/hora e local de cada foto
- Pede permissão de câmera e localização e trata quando o usuário nega
- **GPS:** grava as coordenadas (e o endereço, quando dá) em cada foto
- **Áudio:** som de obturador ao tirar a foto
- **Acelerômetro:** só deixa fotografar com o celular parado
- **Wi-Fi:** mostra o status no topo e só libera "Enviar para a nuvem" com Wi-Fi (o envio é simulado)

## Como rodar

```bash
npm install
npx expo start
```

Depois é só ler o QR code com o app **Expo Go** no celular (precisa ser compatível com o SDK 57).

## Estrutura

- `app/(tabs)/index.js` — tela da câmera
- `app/(tabs)/galeria.js` — galeria de fotos
- `components/WifiStatus.js` — status do Wi-Fi
- `components/BotaoAnimado.js` — botão com animação ao apertar
- `contexts/FotosContext.js` — lista de fotos compartilhada entre as telas

## Observações

- As fotos ficam só na memória, então somem quando o app é fechado.
- Fotografem objetos, não pessoas sem autorização.
