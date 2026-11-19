// features/physical-inventory/components/InventoryScreen.tsx
import { useEffect, useState } from "react";
import { HardDrive, RefreshCw } from "lucide-react";
import { usePhysicalInventory } from "../hooks/usePhysicalInventory";
import { PhysicalInventoryTable } from "./PhysicalInventoryTable";
import { UndoToast } from "./UndoToast";
import { updateVerification } from "../../inventory-verification/services/inventoryVerificationService";
import { useVerificationTransitions } from "../../inventory-verification/hooks/useVerificationTransitions";
import { VerificationTabs, type PestanaVerificacion } from "../../inventory-verification/components/VerificationTabs";
import { getRowKey, type PhysicalInventoryItem } from "../types/physicalInventory";
import { ExportMenu } from "../../export/components/ExportMenu";

interface InventoryScreenProps {
  server: string;
  database: string;
  onDisconnect: () => void;
}

export function InventoryScreen({ server, database, onDisconnect }: InventoryScreenProps) {
  const { data, loading, error, refresh, setEstadoVerificacion } = usePhysicalInventory();
  const { enTransicion, agregar, quitar, cerrar } = useVerificationTransitions();
  const [estadoFiltro, setEstadoFiltro] = useState<"Todos" | "Correcto" | "Alerta">("Todos");
  const [pestana, setPestana] = useState<PestanaVerificacion>("porVerificar");
  const [guardando, setGuardando] = useState<Set<string>>(() => new Set());
  const [verificationError, setVerificationError] = useState<string | null>(null);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Contadores de las pestañas: estado real, sin filtro de estado ni transiciones
  const conteos = {
    porVerificar: data.filter((item) => item.estadoVerificacion !== "Verificado").length,
    verificadas: data.filter((item) => item.estadoVerificacion === "Verificado").length,
  };

  const filas = data
    .filter((item) => {
      if (estadoFiltro === "Todos") return true;
      if (estadoFiltro === "Correcto") return item.estado === "Correcto";
      return item.estado !== "Correcto";
    })
    .filter((item) => {
      // Mientras está en transición, la fila se queda en la pestaña donde se cambió (XOR)
      const verificada = item.estadoVerificacion === "Verificado";
      const transicion = enTransicion.has(getRowKey(item));
      const pestanaDeLaFila: PestanaVerificacion = verificada !== transicion ? "verificadas" : "porVerificar";
      return pestanaDeLaFila === pestana;
    });

  const marcarGuardando = (key: string, activo: boolean) =>
    setGuardando((prev) => {
      const next = new Set(prev);
      if (activo) next.add(key);
      else next.delete(key);
      return next;
    });

  // Actualización optimista: la pantalla cambia de una vez y, si el guardado falla, se revierte
  const guardarVerificacion = async (item: PhysicalInventoryItem, verificado: boolean, conTransicion: boolean) => {
    const key = getRowKey(item);
    const anterior = item.estadoVerificacion;

    setVerificationError(null);
    setEstadoVerificacion(key, verificado ? "Verificado" : "Pendiente");
    if (conTransicion) agregar(key);
    marcarGuardando(key, true);

    try {
      await updateVerification({
        numeroPagina: item.numeroPagina,
        codigoBarra: item.codigoBarra,
        verificado,
      });
    } catch {
      setEstadoVerificacion(key, anterior);
      quitar(key);
      setVerificationError("No fue posible guardar la verificación. Intenta de nuevo.");
    } finally {
      marcarGuardando(key, false);
    }
  };

  const handleToggleVerificado = (item: PhysicalInventoryItem, verificado: boolean) => {
    void guardarVerificacion(item, verificado, true);
  };

  // Revierte todo el lote: envía el valor contrario sin iniciar una transición nueva
  const handleDeshacer = () => {
    const filasDelLote = data.filter((item) => enTransicion.has(getRowKey(item)));
    cerrar();
    filasDelLote.forEach((item) => {
      void guardarVerificacion(item, item.estadoVerificacion !== "Verificado", false);
    });
  };

  // Cambiar de pestaña o actualizar cierra el lote: las filas se mueven de inmediato
  const cambiarPestana = (nueva: PestanaVerificacion) => {
    cerrar();
    setPestana(nueva);
  };

  const handleActualizar = () => {
    cerrar();
    void refresh();
  };

  const loteGuardando = [...enTransicion].some((key) => guardando.has(key));

  return (
    <div className="min-h-screen bg-[#f4f4f5] flex flex-col font-sans selection:bg-blue-100">
      <header className="bg-[#18181b] text-white px-6 py-3 border-b border-gray-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <HardDrive className="w-5 h-5 text-gray-400" />
          <h1 className="font-medium tracking-tight text-sm uppercase">Validación de Inventario</h1>
          <div className="h-4 w-[1px] bg-gray-700 mx-2"></div>
          <span className="text-xs font-mono text-gray-400">
            {server} / {database}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
            <span className="text-gray-300">Conectado</span>
          </div>
          <button onClick={onDisconnect} className="text-gray-400 hover:text-white transition-colors">
            Desconectar
          </button>
        </div>
      </header>

      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0 gap-4">
        <VerificationTabs activa={pestana} onChange={cambiarPestana} conteos={conteos} />
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
            <span>Estado</span>
            <select
              value={estadoFiltro}
              onChange={(event) => setEstadoFiltro(event.target.value as "Todos" | "Correcto" | "Alerta")}
              className="border border-gray-200 rounded-md bg-gray-50 px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="Todos">Todos</option>
              <option value="Correcto">Correcto</option>
              <option value="Alerta">Alerta, verificar</option>
            </select>
          </label>
          <div className="flex items-center gap-2">
            <ExportMenu data={data} />
            <button
              onClick={handleActualizar}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md text-xs font-medium text-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Actualizando..." : "Actualizar"}
            </button>
          </div>
        </div>
      </div>

      {(error || verificationError) && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-2 text-xs text-red-700">
          {error ?? verificationError}
        </div>
      )}

      <main className="flex-1 p-6 overflow-hidden flex flex-col">
        <PhysicalInventoryTable
          data={filas}
          onToggleVerificado={handleToggleVerificado}
          guardando={guardando}
          enTransicion={enTransicion}
          mensajeVacio={
            pestana === "porVerificar" && conteos.porVerificar === 0 && data.length > 0
              ? "Todo verificado."
              : "No hay registros para mostrar."
          }
        />
      </main>

      <UndoToast
        cantidad={enTransicion.size}
        accion={pestana === "porVerificar" ? "verificar" : "devolver"}
        onDeshacer={handleDeshacer}
        deshabilitado={loteGuardando}
      />
    </div>
  );
}