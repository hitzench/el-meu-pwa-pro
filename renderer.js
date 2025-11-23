window.addEventListener('DOMContentLoaded', () => {
    const electronAPI = window.electronAPI;
    if (!electronAPI) return;

    // Gestió dels botons de la finestra (Min/Max/Close)
    ['minimize', 'maximize', 'close'].forEach(action => {
        const btn = document.getElementById(`${action}-btn`);
        if (btn) btn.addEventListener('click', () => electronAPI.windowControl(action));
    });

    // Configurar el Webview
    electronAPI.onConfig((config) => {
        const webview = document.getElementById('main-webview'); 
        const titleSpan = document.querySelector('.app-title');

        if (titleSpan && config.title) titleSpan.textContent = config.title;

        if (webview && config.url) {
            webview.src = config.url; 
            
            // AQUEST BLOC ESCOLTA QUAN LA WEB VOL OBRIR PESTANYES NOVES
            webview.addEventListener('new-window', (e) => {
                e.preventDefault(); // Bloqueja que s'obri dins l'app
                electronAPI.openExternal(e.url); // Envia-ho al navegador del sistema
            });
        }
    });
});