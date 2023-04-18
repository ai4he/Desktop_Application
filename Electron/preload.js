const {ipcRenderer, contextBridge}= require('electron')

// couldn't get ipcRenderer to work from src/js/index.js file so created global constants
// and used contextBridge to make available through whole app using a key word
const DASHBOARD_WIN ={
   createDashboardWin: (message) => ipcRenderer.send("msg", message)
}

contextBridge.exposeInMainWorld("dash", DASHBOARD_WIN)

const TRAK_SERVICE ={
  toggle: (message) => ipcRenderer.send("trak", message)
}

contextBridge.exposeInMainWorld("traking", TRAK_SERVICE)

const CLOSE_APP = {
  closeApp: (message)=> ipcRenderer.send("close_app", message)
}

contextBridge.exposeInMainWorld("closingApp", CLOSE_APP)

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
      const element = document.getElementById(selector)
      if (element) element.innerText = text
    }
  
    for (const dependency of ['chrome', 'node', 'electron']) {
      replaceText(`${dependency}-version`, process.versions[dependency])
    }
  })