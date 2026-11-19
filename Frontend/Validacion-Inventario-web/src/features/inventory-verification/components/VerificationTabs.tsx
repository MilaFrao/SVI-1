// features/inventory-verification/components/VerificationTabs.tsx
export type PestanaVerificacion = "porVerificar" | "verificadas";

interface VerificationTabsProps {
  activa: PestanaVerificacion;
  onChange: (pestana: PestanaVerificacion) => void;
  conteos: Record<PestanaVerificacion, number>;
}

const PESTANAS: { id: PestanaVerificacion; etiqueta: string }[] = [
  { id: "porVerificar", etiqueta: "Por verificar" },
  { id: "verificadas", etiqueta: "Verificadas" },
];

export function VerificationTabs({ activa, onChange, conteos }: VerificationTabsProps) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-md p-0.5">
      {PESTANAS.map(({ id, etiqueta }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            activa === id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {etiqueta}
          <span className="ml-1.5 text-gray-400">{conteos[id]}</span>
        </button>
      ))}
    </div>
  );
}
