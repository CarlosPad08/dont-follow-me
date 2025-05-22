document.getElementById("scrapeBtn").addEventListener("click", () => {
    // Enviar mensaje al background
    chrome.runtime.sendMessage({ action: "scrapeInstagram" }, (response) => {
        const output = document.getElementById("output");

        if (response && response.tipoLista && response.usuarios) {
            output.innerText = `Tipo de lista: ${response.tipoLista}\nTotal: ${response.usuarios.length}\n\n` +
                               response.usuarios.join('\n');
        } else {
            output.innerText = "No se pudieron obtener los datos. Asegúrate de estar en Instagram y haber abierto la lista.";
        }
    });
});
