// features/connection/services/conexionesService.ts
// Puente con Electron para la lista de conexiones y las contraseñas recordadas.
// En el navegador (desarrollo sin Electron) no hay lista: solo queda la conexión manual.
import type { DatosConexion, ResultadoCargaConexiones } from "../types/connection";

export async function cargarConexiones(): Promise<ResultadoCargaConexiones> {
    const api = window.electronAPI;
    if (!api?.cargarConexiones) return { conexiones: [] };
    return api.cargarConexiones();
}

export function puedeImportarConexiones(): boolean {
    return !!window.electronAPI?.importarConexiones;
}

export async function importarConexiones(): Promise<boolean> {
    const result = await window.electronAPI?.importarConexiones?.();
    return result?.importadas ?? false;
}

export async function agregarConexionManual(datos: DatosConexion): Promise<void> {
    await window.electronAPI?.agregarConexionManual?.(datos);
}

export async function guardarContrasena(datos: DatosConexion, contrasena: string): Promise<void> {
    await window.electronAPI?.guardarContrasena?.(datos, contrasena);
}

export async function obtenerContrasena(datos: DatosConexion): Promise<string | null> {
    return (await window.electronAPI?.obtenerContrasena?.(datos)) ?? null;
}

export async function olvidarContrasena(datos: DatosConexion): Promise<void> {
    await window.electronAPI?.olvidarContrasena?.(datos);
}
