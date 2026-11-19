// features/connection/components/ConnectionScreen.tsx
// Decide qué mostrar: la lista de conexiones (si hay) o el formulario manual (siempre disponible).
import { useCallback, useEffect, useState } from "react";
import { ConnectionList } from "./ConnectionList";
import { ConnectionForm } from "./ConnectionForm";
import { testConnection } from "../services/connectionService";
import {
  agregarConexionManual,
  cargarConexiones,
  guardarContrasena,
  importarConexiones,
  olvidarContrasena,
  puedeImportarConexiones,
} from "../services/conexionesService";
import type { DatosConexion, OpcionesConexion, ResultadoCargaConexiones } from "../types/connection";

interface ConnectionScreenProps {
  onConnected: (server: string, database: string) => void;
}

export function ConnectionScreen({ onConnected }: ConnectionScreenProps) {
  const [carga, setCarga] = useState<ResultadoCargaConexiones | null>(null);
  const [modo, setModo] = useState<"lista" | "manual">("lista");

  const recargar = useCallback(async () => {
    setCarga(await cargarConexiones());
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  // Devuelve el mensaje de error, o null si conectó
  const conectar = async (
    datos: DatosConexion,
    contrasena: string,
    opciones: OpcionesConexion
  ): Promise<string | null> => {
    try {
      const result = await testConnection({
        server: datos.servidor,
        database: datos.base,
        user: datos.usuario,
        password: contrasena,
      });
      if (!result.success) return result.message;

      if (opciones.recordar) await guardarContrasena(datos, contrasena);
      if (opciones.manual) await agregarConexionManual(datos);
      onConnected(datos.servidor, datos.base);
      return null;
    } catch {
      return "No fue posible comunicarse con el servidor.";
    }
  };

  const handleImportar = async () => {
    if (await importarConexiones()) {
      await recargar();
      setModo("lista");
    }
  };

  const handleOlvidar = async (datos: DatosConexion) => {
    await olvidarContrasena(datos);
    await recargar();
  };

  // Mientras Electron lee el archivo (es casi instantáneo)
  if (!carga) return <div className="min-h-screen bg-[#f4f4f5]" />;

  const hayLista = carga.conexiones.length > 0;
  const importar = puedeImportarConexiones() ? handleImportar : undefined;

  if (hayLista && modo === "lista") {
    return (
      <ConnectionList
        conexiones={carga.conexiones}
        onConectar={conectar}
        onOlvidar={handleOlvidar}
        onImportar={importar}
        onManual={() => setModo("manual")}
      />
    );
  }

  return (
    <ConnectionForm
      aviso={hayLista ? undefined : carga.aviso}
      onConectar={conectar}
      onImportar={importar}
      onVolver={hayLista ? () => setModo("lista") : undefined}
    />
  );
}
