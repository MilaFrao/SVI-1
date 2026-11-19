const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    apiBaseUrl: 'http://localhost:5066',
    isElectron: true,

    saveFile: (filename, data) =>
        ipcRenderer.invoke('save-export-file', { filename, data }),

    openExportsFolder: () => ipcRenderer.invoke('open-exports-folder'),

    cargarConexiones: () => ipcRenderer.invoke('conexiones-cargar'),
    importarConexiones: () => ipcRenderer.invoke('conexiones-importar'),
    agregarConexionManual: (conexion) => ipcRenderer.invoke('conexiones-agregar-manual', conexion),
    guardarContrasena: (conexion, contrasena) => ipcRenderer.invoke('contrasena-guardar', { conexion, contrasena }),
    obtenerContrasena: (conexion) => ipcRenderer.invoke('contrasena-obtener', conexion),
    olvidarContrasena: (conexion) => ipcRenderer.invoke('contrasena-olvidar', conexion),
});