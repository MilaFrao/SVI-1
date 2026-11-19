// features/connection/components/ConnectionList.tsx
import { useState } from "react";
import { HardDrive, Search, Store, Warehouse, KeyRound, RefreshCw, FileUp, PenLine } from "lucide-react";
import { obtenerContrasena } from "../services/conexionesService";
import { claveConexion, type ConexionGuardada, type DatosConexion, type OpcionesConexion } from "../types/connection";

interface ConnectionListProps {
  conexiones: ConexionGuardada[];
  onConectar: (datos: DatosConexion, contrasena: string, opciones: OpcionesConexion) => Promise<string | null>;
  onOlvidar: (datos: DatosConexion) => Promise<void>;
  onImportar?: () => void;
  onManual: () => void;
}

function agrupar(conexiones: ConexionGuardada[]) {
  const grupos = new Map<string, ConexionGuardada[]>();
  conexiones.forEach((c) => grupos.set(c.grupo, [...(grupos.get(c.grupo) ?? []), c]));
  return [...grupos.entries()];
}

function IconoGrupo({ grupo }: { grupo: string }) {
  const Icono = grupo.toLowerCase().includes("bodega") ? Warehouse : Store;
  return <Icono className="w-4 h-4 text-gray-400 shrink-0" />;
}

export function ConnectionList({ conexiones, onConectar, onOlvidar, onImportar, onManual }: ConnectionListProps) {
  const [busqueda, setBusqueda] = useState("");
  const [clave, setClave] = useState(() => claveConexion(conexiones[0]));
  const [contrasena, setContrasena] = useState("");
  const [recordar, setRecordar] = useState(false);
  const [pedirContrasena, setPedirContrasena] = useState(false); // la contraseña recordada falló
  const [conectando, setConectando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actual = conexiones.find((c) => claveConexion(c) === clave) ?? conexiones[0];
  const usarRecordada = actual.recordada && !pedirContrasena;

  const texto = busqueda.trim().toLowerCase();
  const filtradas = conexiones.filter((c) =>
    `${c.alias} ${c.servidor} ${c.base}`.toLowerCase().includes(texto)
  );

  const seleccionar = (c: ConexionGuardada) => {
    setClave(claveConexion(c));
    setContrasena("");
    setRecordar(false);
    setPedirContrasena(false);
    setError(null);
  };

  const handleConectar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let contrasenaFinal = contrasena;
    if (usarRecordada) {
      const guardada = await obtenerContrasena(actual);
      if (!guardada) {
        setPedirContrasena(true);
        setError("No se pudo leer la contraseña recordada. Escríbela de nuevo.");
        return;
      }
      contrasenaFinal = guardada;
    } else if (!contrasenaFinal) {
      setError("Escribe la contraseña.");
      return;
    }

    setConectando(true);
    const fallo = await onConectar(actual, contrasenaFinal, { recordar: !usarRecordada && recordar, manual: false });
    setConectando(false);

    if (fallo) {
      setError(fallo);
      // Si falló con la recordada (p. ej. cambiaron la contraseña), se pide de nuevo
      if (usarRecordada) setPedirContrasena(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f4f5] flex items-center justify-center p-4 selection:bg-blue-100">
      <div className="w-full max-w-4xl bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
        <div className="bg-[#18181b] px-6 py-4 border-b border-gray-800 flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-gray-400" />
          <h1 className="text-white font-medium tracking-tight text-sm uppercase">Validación de Inventario</h1>
        </div>

        <div className="grid grid-cols-[1.1fr_1fr] min-h-[440px]">
          {/* Lista */}
          <div className="border-r border-gray-100 p-5 flex flex-col">
            <p className="text-sm font-medium text-gray-900 mb-3">Elige una conexión</p>
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar sucursal o bodega"
                className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex-1 overflow-auto max-h-[320px] -mx-1 px-1">
              {filtradas.length === 0 && (
                <p className="text-xs text-gray-500 px-2 py-3">Sin resultados. Revisa el nombre o la IP.</p>
              )}
              {agrupar(filtradas).map(([grupo, items]) => (
                <div key={grupo} className="mb-2">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-2 pt-2 pb-1">{grupo}</p>
                  {items.map((c) => {
                    const activa = claveConexion(c) === claveConexion(actual);
                    return (
                      <button
                        key={claveConexion(c)}
                        type="button"
                        onClick={() => seleccionar(c)}
                        className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-left border transition-colors ${
                          activa ? "bg-blue-50 border-blue-200" : "border-transparent hover:bg-gray-50"
                        }`}
                      >
                        <IconoGrupo grupo={c.grupo} />
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium text-gray-900 truncate">{c.alias}</span>
                          <span className="block text-[11px] font-mono text-gray-500 truncate">
                            {c.servidor} · {c.base}
                          </span>
                        </span>
                        {c.recordada && (
                          <KeyRound className="w-3.5 h-3.5 text-green-600 shrink-0" aria-label="Contraseña recordada" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="pt-3 mt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
              {onImportar ? (
                <button type="button" onClick={onImportar} className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700">
                  <FileUp className="w-3 h-3" /> Importar otro archivo
                </button>
              ) : (
                <span />
              )}
              <button type="button" onClick={onManual} className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700">
                <PenLine className="w-3 h-3" /> Conexión manual
              </button>
            </div>
          </div>

          {/* Detalle */}
          <form onSubmit={handleConectar} className="p-6 flex flex-col">
            <p className="text-xs text-gray-500">{actual.grupo}</p>
            <p className="text-lg font-medium text-gray-900 mb-4">{actual.alias}</p>

            <dl className="grid grid-cols-[72px_1fr] gap-x-3 gap-y-1.5 text-xs mb-5">
              <dt className="text-gray-400">Servidor</dt>
              <dd className="font-mono text-gray-700 break-all">{actual.servidor}</dd>
              <dt className="text-gray-400">Base</dt>
              <dd className="font-mono text-gray-700 break-all">{actual.base}</dd>
              <dt className="text-gray-400">Usuario</dt>
              <dd className="font-mono text-gray-700 break-all">{actual.usuario}</dd>
            </dl>

            {usarRecordada ? (
              <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2 mb-3">
                <KeyRound className="w-3.5 h-3.5" /> Contraseña recordada en este equipo
              </div>
            ) : (
              <>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Contraseña de SQL Server
                </label>
                <input
                  type="password"
                  value={contrasena}
                  onChange={(e) => {
                    setContrasena(e.target.value);
                    setError(null);
                  }}
                  autoFocus
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <label className="flex items-center gap-2 text-xs text-gray-600 mt-2.5 mb-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={recordar}
                    onChange={(e) => setRecordar(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-300"
                  />
                  Recordar en este equipo
                </label>
              </>
            )}

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={conectando}
              className="w-full bg-[#18181b] hover:bg-gray-800 text-white font-medium py-2.5 px-4 rounded-md text-sm transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {conectando ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Conectando...
                </>
              ) : (
                "Conectar"
              )}
            </button>

            {usarRecordada && (
              <button
                type="button"
                onClick={() => void onOlvidar(actual)}
                className="mt-3 text-[11px] text-gray-400 hover:text-red-600 transition-colors self-center"
              >
                Olvidar contraseña
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
