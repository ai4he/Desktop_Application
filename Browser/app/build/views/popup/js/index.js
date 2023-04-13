window.addEventListener("DOMContentLoaded", async () => {
  const api_url = "http://127.0.0.1:3333";

  // Obteniendo switch
  const activeExtensionSwitch = document.getElementById("activeExtension");
  // Obteniendo input de calendario
  const dateLogs = document.getElementById("dateLogs");
  // Obteniendo btnLogsDownload
  const btnLogsDownload = document.getElementById("btnLogsDownload");

  //Switch activeExtension
  // Obteniendo valor almacenado
  const storage = await chrome.storage.sync.get("isActive");
  // Asignando valor previo del usuario al switch
  activeExtensionSwitch.checked = storage.isActive;

  activeExtensionSwitch.addEventListener("change", async (e) => {
    const isChecked = e.target.checked;

    // Almacenando valor del switch en storage
    await chrome.storage.sync.set({ isActive: isChecked });
    // Cambiando el estado del switch
    activeExtensionSwitch.checked = isChecked;

    // Refrescando tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.reload(tabs[0].id);
    });
  });

  // Switch dateLogs
  // Implementando fecha maxima que el usuario puede seleccionar
  dateLogs.max = new Date().toISOString().split("T")[0];
  // Obteniendo div container de logs
  const txtLogs = document.getElementById("txtLogs");

  let logs = null;

  dateLogs.addEventListener("change", async () => {
    await fetch(`${api_url}/events/log/${dateLogs.value}`)
      .then(async (response) => {
        // Desactivando boton de descarga
        btnLogsDownload.disabled = true;
        // Limpiando txtLogs
        txtLogs.innerHTML = "";

        const value = await response.json();

        if (response.status !== 200) {
          if (!value.logs) return;

          const newDiv = document.createElement("div");
          const newParagraph = document.createElement("p");

          newParagraph.innerText = `${value.logs}`;
          newDiv.appendChild(newParagraph);
          txtLogs.appendChild(newDiv);
          return;
        }

        // Guardando logs
        logs = value.logs;
        // Activando button de descarga
        btnLogsDownload.disabled = false;
        value.logs.forEach((log) => {
          const newDiv = document.createElement("div");
          const newParagraph = document.createElement("p");
          const hr = document.createElement("hr");

          newParagraph.innerText = log;

          newDiv.appendChild(newParagraph);
          newDiv.appendChild(hr);
          txtLogs.appendChild(newDiv);
        });
      })
      .catch(() => {});
  });

  // Button btnLogsDownload
  btnLogsDownload.addEventListener("click", () => {
    if (!logs) return;

    // Creando archivo de texto
    const content = logs.map((log) => `${log}\n`);
    const a = document.createElement("a");
    const file = new Blob(content, { type: "text/plain" });
    const url = URL.createObjectURL(file);
    a.href = url;
    a.download = `registros de ${dateLogs.value}.txt`;
    // Descargando
    a.click();
    URL.revokeObjectURL(url);
  });
});
