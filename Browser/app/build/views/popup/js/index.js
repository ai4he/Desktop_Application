window.addEventListener("DOMContentLoaded", async () => {
  // Obteniendo switch
  const activeExtensionSwitch = document.getElementById("activeExtension");
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
});
