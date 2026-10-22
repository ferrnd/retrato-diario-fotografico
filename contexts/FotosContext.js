import { createContext, useContext, useState } from "react";

const FotosContext = createContext();

export function FotosProvider({ children }) {
  const [fotos, setFotos] = useState([]);

  function adicionarFoto(uri, local) {
    setFotos((atuais) => [
      { uri, local, data: new Date().toLocaleString("pt-BR") },
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