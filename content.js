function getInstagramList() {
    let usuarios = [];

    const dialog = document.querySelector('div[role="dialog"]');
    if (!dialog) {
        console.log("No se encontró el diálogo de seguidores/seguidos.");
        return { tipoLista: "ninguno", usuarios: [] };
    }

    const heading = dialog.querySelector('div[role="heading"]');
    let tipoLista = 'desconocido';

    if (heading) {
        const texto = heading.innerText.trim().toLowerCase();
        if (texto.includes('seguidos')) {
            tipoLista = 'seguidos';
        } else if (texto.includes('seguidores')) {
            tipoLista = 'seguidores';
        }
    }

    dialog.querySelectorAll('a.x1i10hfl').forEach(user => {
        const username = user.innerText.trim();
        if (username) {
            usuarios.push(username);
        }
    });

    return { tipoLista, usuarios };
}

// Escuchar mensajes del background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getList") {
        const resultado = getInstagramList();
        sendResponse(resultado);
    }
});
