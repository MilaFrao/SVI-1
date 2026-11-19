const { app, BrowserWindow, ipcMain, dialog, safeStorage, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const fs = require('fs');

const BACKEND_PORT = 5066;
let backendProcess = null;
let mainWindow = null;

const logPath = path.join(app.getPath('userData'), 'backend.log');
const logStream = fs.createWriteStream(logPath, { flags: 'a' });

function getBackendExePath() {
    const backendFolder = app.isPackaged
    ? path.join(process.resourcesPath, 'backend')
    : path.join(__dirname, 'resources', 'backend');

    return path.join(backendFolder, 'ValidacionInventario.Api.exe');
}

    function startBackend() {
        const exePath = getBackendExePath();

        backendProcess = spawn(exePath, [], {
            env: { ...process.env, ASPNETCORE_URLS: `http://localhost:${BACKEND_PORT}` },
        });

        backendProcess.stdout.on('data', (data) => logStream.write(`[backend] ${data}`));
        backendProcess.stderr.on('data', (data) => logStream.write(`[backend-error] ${data}`));

        backendProcess.on('exit', (code) => {
            logStream.write(`Backend cerrado con código ${code}\n`);
        });
}

function waitForBackend(retriesLeft = 30) {
    return new Promise((resolve, reject) => {
        const check = () => {
        http.get(`http://localhost:${BACKEND_PORT}/health`, (res) => {
            if (res.statusCode === 200) {
            resolve();
            } else {
            retry();
            }
        }).on('error', retry);
    };

        const retry = () => {
            if (retriesLeft <= 0) {
                reject(new Error('El backend no respondió a tiempo.'));
                return;
            }
            retriesLeft--;
            setTimeout(check, 500);
            };

        check();
    });
}

function getUniquePath(targetPath) {
    if (!fs.existsSync(targetPath)) return targetPath;

    const dir = path.dirname(targetPath);
    const ext = path.extname(targetPath);
    const base = path.basename(targetPath, ext);

    let counter = 1;
    let candidate;
    do {
        candidate = path.join(dir, `${base} (${counter})${ext}`);
        counter++;
    } while (fs.existsSync(candidate));

    return candidate;
}

function getExportsDir() {
    const dir = path.join(app.getPath('documents'), 'Validación de Inventario', 'Exportaciones');
    fs.mkdirSync(dir, { recursive: true });
    return dir;
}

// --- Conexiones predeterminadas (conexiones.json) y contraseñas recordadas ---
// conexiones.json vive en Documentos (fuera de la carpeta de instalación) y nunca guarda contraseñas.
// Las contraseñas van aparte, cifradas con safeStorage, en un diccionario con clave servidor|base|usuario.

const GRUPO_MANUAL = 'Agregadas manualmente';

function getDataDir() {
    const dir = path.join(app.getPath('documents'), 'Validación de Inventario', 'DATA');
    fs.mkdirSync(dir, { recursive: true });
    return dir;
}

function getConexionesPath() {
    return path.join(getDataDir(), 'conexiones.json');
}

function getContrasenasPath() {
    return path.join(app.getPath('userData'), 'contrasenas.cred');
}

// Misma regla que claveConexion() en el frontend: identifica una conexión sin depender del alias
function claveConexion(c) {
    return `${c.servidor}|${c.base}|${c.usuario}`.toLowerCase();
}

function esConexionValida(c) {
    return !!c && ['alias', 'servidor', 'base', 'usuario'].every(
        (campo) => typeof c[campo] === 'string' && c[campo].trim() !== ''
    );
}

function normalizarConexion(c) {
    return {
        alias: c.alias.trim(),
        grupo: (typeof c.grupo === 'string' && c.grupo.trim()) || 'Sin grupo',
        servidor: c.servidor.trim(),
        base: c.base.trim(),
        usuario: c.usuario.trim(),
        ...(c.manual === true ? { manual: true } : {}),
    };
}

// Bloc de notas puede guardar el JSON con BOM; JSON.parse no lo acepta
function leerTexto(archivo) {
    return fs.readFileSync(archivo, 'utf8').replace(/^﻿/, '');
}

function parsearConexiones(texto) {
    const datos = JSON.parse(texto);
    if (!Array.isArray(datos?.conexiones)) throw new Error('Formato inválido');
    return datos.conexiones.filter(esConexionValida).map(normalizarConexion);
}

function leerConexiones() {
    const archivo = getConexionesPath();
    if (!fs.existsSync(archivo)) {
        return { conexiones: [], aviso: 'No se encontró el archivo de conexiones. Puedes importarlo o conectarte manualmente.' };
    }
    try {
        return { conexiones: parsearConexiones(leerTexto(archivo)) };
    } catch {
        return { conexiones: [], aviso: 'El archivo de conexiones tiene un error de formato. Puedes importar otro o conectarte manualmente.' };
    }
}

function leerContrasenas() {
    const archivo = getContrasenasPath();
    if (!fs.existsSync(archivo) || !safeStorage.isEncryptionAvailable()) return {};
    try {
        return JSON.parse(safeStorage.decryptString(fs.readFileSync(archivo)));
    } catch {
        return {}; // archivo corrupto o cifrado con otra cuenta de Windows
    }
}

function escribirContrasenas(mapa) {
    fs.writeFileSync(getContrasenasPath(), safeStorage.encryptString(JSON.stringify(mapa)));
}

function plural(cantidad, singular, pluralTexto) {
    return `${cantidad} ${cantidad === 1 ? singular : pluralTexto}`;
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1100,
        minHeight: 700,
        show: false,
        icon: path.join(__dirname, 'resources', 'icon.ico'),
        webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        },
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.maximize();
        mainWindow.show();
    });

    const frontendPath = app.isPackaged
        ? path.join(process.resourcesPath, 'frontend', 'index.html')
        : path.join(__dirname, '..', 'Frontend', 'Validacion-Inventario-web', 'dist', 'index.html');

    mainWindow.loadFile(frontendPath);
    }

    function registerIpcHandlers() {
    ipcMain.handle('save-export-file', async (_event, { filename, data }) => {
    const exportsDir = getExportsDir();
    const targetPath = getUniquePath(path.join(exportsDir, filename));

    const buffer = typeof data === 'string' ? Buffer.from(data, 'utf-8') : Buffer.from(data);
    fs.writeFileSync(targetPath, buffer);

    return { success: true, path: targetPath };
    });

    // --- Conexiones ---
    ipcMain.handle('conexiones-cargar', () => {
        const { conexiones, aviso } = leerConexiones();
        const recordadas = leerContrasenas();
        // Solo se informa si hay contraseña recordada; la contraseña en sí no sale de aquí
        return {
            conexiones: conexiones.map((c) => ({ ...c, recordada: claveConexion(c) in recordadas })),
            aviso,
        };
    });

    ipcMain.handle('conexiones-importar', async () => {
        const seleccion = await dialog.showOpenDialog(mainWindow, {
            title: 'Importar archivo de conexiones',
            filters: [{ name: 'Conexiones', extensions: ['json'] }],
            properties: ['openFile'],
        });
        if (seleccion.canceled || seleccion.filePaths.length === 0) return { importadas: false };

        let texto;
        let nuevas;
        try {
            texto = leerTexto(seleccion.filePaths[0]);
            nuevas = parsearConexiones(texto);
        } catch {
            nuevas = [];
        }
        if (nuevas.length === 0) {
            await dialog.showMessageBox(mainWindow, {
                type: 'error',
                title: 'Importar conexiones',
                message: 'El archivo seleccionado no contiene conexiones válidas.',
            });
            return { importadas: false };
        }

        const manuales = leerConexiones().conexiones.filter((c) => c.manual).length;
        const { response } = await dialog.showMessageBox(mainWindow, {
            type: 'question',
            buttons: ['Reemplazar', 'Cancelar'],
            defaultId: 1,
            cancelId: 1,
            title: 'Importar conexiones',
            message: `Se reemplazará la lista actual por ${plural(nuevas.length, 'conexión', 'conexiones')} del archivo seleccionado.`,
            detail: manuales > 0
                ? `Se perderán ${plural(manuales, 'conexión agregada', 'conexiones agregadas')} manualmente.`
                : undefined,
        });
        if (response !== 0) return { importadas: false };

        fs.writeFileSync(getConexionesPath(), texto, 'utf8');
        return { importadas: true };
    });

    // Agrega una conexión manual al archivo solo si es nueva (servidor + base + usuario)
    ipcMain.handle('conexiones-agregar-manual', (_event, datos) => {
        const archivo = getConexionesPath();
        let contenido = { conexiones: [] };
        if (fs.existsSync(archivo)) {
            try {
                contenido = JSON.parse(leerTexto(archivo));
            } catch {
                return { agregada: false }; // no se reescribe un archivo con errores
            }
            if (!Array.isArray(contenido?.conexiones)) return { agregada: false };
        }

        const nueva = normalizarConexion({
            alias: datos.base,
            grupo: GRUPO_MANUAL,
            servidor: datos.servidor,
            base: datos.base,
            usuario: datos.usuario,
            manual: true,
        });
        const existe = contenido.conexiones
            .filter(esConexionValida)
            .some((c) => claveConexion(c) === claveConexion(nueva));
        if (existe) return { agregada: false };

        contenido.conexiones.push(nueva);
        fs.writeFileSync(archivo, JSON.stringify(contenido, null, 2), 'utf8');
        return { agregada: true };
    });

    // --- Contraseñas recordadas ---
    ipcMain.handle('contrasena-guardar', (_event, { conexion, contrasena }) => {
        if (!safeStorage.isEncryptionAvailable()) return { success: false };
        const mapa = leerContrasenas();
        mapa[claveConexion(conexion)] = contrasena;
        escribirContrasenas(mapa);
        return { success: true };
    });

    ipcMain.handle('contrasena-obtener', (_event, conexion) => {
        return leerContrasenas()[claveConexion(conexion)] ?? null;
    });

    ipcMain.handle('contrasena-olvidar', (_event, conexion) => {
        if (!safeStorage.isEncryptionAvailable()) return { success: false };
        const mapa = leerContrasenas();
        delete mapa[claveConexion(conexion)];
        escribirContrasenas(mapa);
        return { success: true };
    });

    ipcMain.handle('open-exports-folder', () => {
        shell.openPath(getExportsDir());
    });
    }

    app.whenReady().then(async () => {
    // La pestaña "Conexión reciente" se retiró: se borra la credencial que haya dejado
    fs.rmSync(path.join(app.getPath('userData'), 'connection.cred'), { force: true });

    registerIpcHandlers();
    startBackend();

    try {
        await waitForBackend();
        createWindow();
    } catch (err) {
        logStream.write(`Error al iniciar: ${err}\n`);
        app.quit();
    }
    });

    app.on('window-all-closed', () => {
        if (backendProcess) backendProcess.kill();
        if (process.platform !== 'darwin') app.quit();
    });

    app.on('before-quit', () => {
        if (backendProcess) backendProcess.kill();
    });