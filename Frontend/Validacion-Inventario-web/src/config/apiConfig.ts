import type { DatosConexion, ResultadoCargaConexiones } from "../features/connection/types/connection";

declare global {
    interface Window {
        electronAPI?: {
            apiBaseUrl: string;
            isElectron?: boolean;
            saveFile?: (
                filename: string,
                data: Uint8Array | string
            ) => Promise<{ success: boolean; path?: string }>;
            openExportsFolder?: () => Promise<void>;
            cargarConexiones?: () => Promise<ResultadoCargaConexiones>;
            importarConexiones?: () => Promise<{ importadas: boolean }>;
            agregarConexionManual?: (conexion: DatosConexion) => Promise<{ agregada: boolean }>;
            guardarContrasena?: (conexion: DatosConexion, contrasena: string) => Promise<{ success: boolean }>;
            obtenerContrasena?: (conexion: DatosConexion) => Promise<string | null>;
            olvidarContrasena?: (conexion: DatosConexion) => Promise<{ success: boolean }>;
        };
    }
}

export const API_BASE_URL = window.electronAPI?.apiBaseUrl ?? import.meta.env.VITE_API_BASE_URL;
