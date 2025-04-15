import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
// eslint-disable-next-line no-constant-condition
if (process.contextIsolated || true) {
    try {
        contextBridge.exposeInMainWorld('electron', electronAPI)
        contextBridge.exposeInMainWorld('api', api)
        contextBridge.exposeInMainWorld('electronAPI', {
            onStartTimer: (callback) =>
                ipcRenderer.on('startTimer', (_event, value) => callback(value)),
            onStopTimer: (callback) =>
                ipcRenderer.on('stopTimer', (_event, value) => callback(value)),
            onToggleTimer: (callback) =>
                ipcRenderer.on('toggleTimer', (_event, value) => callback(value)),
            startTimer: () => ipcRenderer.send('startTimer'),
            stopTimer: () => ipcRenderer.send('stopTimer'),
            updateAvailable: () => ipcRenderer.send('updateAvailable'),
            updateNotAvailable: () => ipcRenderer.send('updateNotAvailable'),
        })
    } catch (error) {
        console.error(error)
    }
} else {
    // @ts-ignore (define in dts)
    window.electron = electronAPI
    // @ts-ignore (define in dts)
    window.api = api
}
