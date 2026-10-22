import { createContext, useContext, useState } from "react";

const FotosContext = createContext();

// guarda as fotos na memória (somem ao fechar o app)
export function FotosProvider({ children }) {
  const [fotos, setFotos] = useState([]);

  function adicionarFoto({ uri, largura, altura, tamanho }, local) {
    setFotos((atuais) => [
      // foto nova vai pro começo da lista
      {
        uri,
        largura,
        altura,
        tamanho,
        local,
        data: new Date().toLocaleString("pt-BR"),
      },
      ...atuais,
    ]);
  }

  function removerFotos(uris) {
    setFotos((atuais) => atuais.filter((foto) => !uris.includes(foto.uri)));
  }

  return (
    <FotosContext.Provider value={{ fotos, adicionarFoto, removerFotos }}>
      {children}
    </FotosContext.Provider>
  );
}

export function useFotos() {
  return useContext(FotosContext);
}