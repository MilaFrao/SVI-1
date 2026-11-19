export interface TestConnectionRequest
{
    server: string;
    database: string;
    user: string;
    password: string;
}

export interface TestConnectionResponse
{
    success: boolean;
    message: string;
}

// Datos que identifican una conexión (nunca incluyen la contraseña)
export interface DatosConexion
{
    servidor: string;
    base: string;
    usuario: string;
}

// Una entrada de conexiones.json, tal como la entrega Electron
export interface ConexionGuardada extends DatosConexion
{
    alias: string;
    grupo: string;
    manual?: boolean;
    recordada: boolean; // hay contraseña recordada en este equipo
}

export interface ResultadoCargaConexiones
{
    conexiones: ConexionGuardada[];
    aviso?: string; // el archivo no existe o tiene errores
}

export interface OpcionesConexion
{
    recordar: boolean;
    manual: boolean;
}

// Misma regla que claveConexion() en Desktop/main.js
export function claveConexion(c: DatosConexion) {
    return `${c.servidor}|${c.base}|${c.usuario}`.toLowerCase();
}
