// launcher.js
window.addEventListener('DOMContentLoaded', () => {
    const electronAPI = window.electronAPI;
    const pwaList = document.getElementById('pwa-list');
    const form = document.getElementById('add-app-form');

    // Funció per DIBUIXAR la llista
    function renderApps(apps) {
        pwaList.innerHTML = ''; // Neteja la llista actual

        if (apps.length === 0) {
            pwaList.innerHTML = '<li class="no-apps">No tens cap PWA creada. Afegiu-ne una!</li>';
            return;
        }

        apps.forEach(app => {
            const li = document.createElement('li');
            li.className = 'pwa-item';
            
            // Botó per obrir la PWA
            const openBtn = document.createElement('button');
            openBtn.textContent = `▶ ${app.title}`;
            openBtn.className = 'open-btn';
            openBtn.onclick = () => {
                electronAPI.openPwa(app); // Envia la petició d'obertura a main.js
            };
            
            // Botó per esborrar
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '✖';
            deleteBtn.className = 'delete-btn';
            deleteBtn.onclick = () => {
                electronAPI.deleteApp(app.id); // Envia la petició d'esborrat
            };
            
            li.appendChild(openBtn);
            li.appendChild(deleteBtn);
            pwaList.appendChild(li);
        });
    }

    // Carregar apps en iniciar
    electronAPI.getApps().then(apps => {
        renderApps(apps);
    });

    // Subscripció per rebre actualitzacions després de guardar/esborrar
    electronAPI.onAppsUpdated((apps) => {
        renderApps(apps);
    });
    
    // Gestió del Formulari: Afegir nova app
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const title = document.getElementById('app-title').value;
        const url = document.getElementById('app-url').value;
        
        // La icona es pot buscar si vols, de moment la posem buida
        const newApp = { title, url, icon: "" }; 
        
        electronAPI.addApp(newApp);
        
        form.reset(); // Neteja el formulari
    });

    // Lògica dels botons Mac (reutilitzem el codi de renderer.js)
    document.getElementById('minimize-btn').addEventListener('click', () => electronAPI.windowControl('minimize'));
    document.getElementById('maximize-btn').addEventListener('click', () => electronAPI.windowControl('maximize'));
    document.getElementById('close-btn').addEventListener('click', () => electronAPI.windowControl('close'));
});