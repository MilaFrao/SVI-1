// features/inventory-verification/hooks/useVerificationTransitions.ts
import { useCallback, useEffect, useRef, useState } from "react";

// Tiempo que una fila recién marcada/desmarcada permanece en su pestaña antes de moverse
const TRANSICION_MS = 5000;

/**
 * Maneja el "lote" de filas en transición: cada cambio se suma al lote y reinicia la cuenta.
 * Cuando la cuenta termina (o se llama a cerrar), el lote se vacía y las filas se mueven de pestaña.
 */
export function useVerificationTransitions() {
  const [lote, setLote] = useState<Set<string>>(() => new Set());
  const timer = useRef<number | undefined>(undefined);

  const cerrar = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
    setLote(new Set());
  }, []);

  const agregar = useCallback((key: string) => {
    setLote((prev) => new Set(prev).add(key));
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(cerrar, TRANSICION_MS);
  }, [cerrar]);

  const quitar = useCallback((key: string) => {
    setLote((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { enTransicion: lote, agregar, quitar, cerrar };
}
