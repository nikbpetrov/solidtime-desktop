export async function listenForBackendEvent(event: string, callback: () => void) {
    if (event === 'startTimer') {
        window.electronAPI.onStartTimer(() => {
            callback()
        })
    }
    if (event === 'stopTimer') {
        window.electronAPI.onStopTimer(() => {
            callback()
        })
    }
    if (event === 'toggleTimer') {
        window.electronAPI.onToggleTimer(() => {
            callback()
        })
    }
}

export async function sendEventToWindow(_: string, event: string) {
    if (event === 'startTimer') {
        window.electronAPI.startTimer()
    }
    if (event === 'stopTimer') {
        window.electronAPI.stopTimer()
    }
}
