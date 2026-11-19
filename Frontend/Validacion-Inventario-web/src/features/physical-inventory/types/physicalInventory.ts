// features/physical-inventory/types/physicalInventory.ts
export type EstadoVerificacion = "Pendiente" | "Verificado" | "Modificado";

export interface PhysicalInventoryItem {
    numeroPagina: number;
    codigoBarra: string;
    referencia: string | null;
    toma1: number;
    usuario1: string;
    toma2: number;
    usuario2: string | null;
    validacion1: number;
    estado: string;
    existencia: number;
    validacion2: number;
    validacion3: number;
    coincidencia: string;
    estadoVerificacion: EstadoVerificacion;
    fechaVerificacion: string | null;
}

// Clave única de una fila: misma combinación que usa el backend para identificar la verificación
export function getRowKey(item: Pick<PhysicalInventoryItem, "numeroPagina" | "codigoBarra">) {
    return `${item.numeroPagina}-${item.codigoBarra}`;
}
