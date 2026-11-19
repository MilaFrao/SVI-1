// features/physical-inventory/components/UndoToast.tsx
interface UndoToastProps {
  cantidad: number;
  accion: "verificar" | "devolver";
  onDeshacer: () => void;
  deshabilitado: boolean; // true mientras alguna fila del lote se está guardando
}

export function UndoToast({ cantidad, accion, onDeshacer, deshabilitado }: UndoToastProps) {
  if (cantidad === 0) return null;

  const plural = cantidad !== 1;
  const texto =
    accion === "verificar"
      ? `${cantidad} ${plural ? "filas verificadas" : "fila verificada"}`
      : `${cantidad} ${plural ? "filas devueltas" : "fila devuelta"} a Por verificar`;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-[#18181b] text-white text-xs px-4 py-2.5 rounded-lg shadow-lg">
      <span>{texto}</span>
      <button
        onClick={onDeshacer}
        disabled={deshabilitado}
        className="font-semibold text-blue-300 hover:text-blue-200 disabled:opacity-50"
      >
        Deshacer
      </button>
    </div>
  );
}
