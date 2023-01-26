const { app, BrowserWindow,ipcMain } = require('electron')
const path = require('path')
const { menubar } = require('menubar');
const {execFile}=require('child_process')


function createWindow () {
  const win = new BrowserWindow({
  width: 800,
  height: 600,
  // will create a window without menu
  frame: false,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js')
  }
})

  win.loadFile('src/index.html')

  // if main.js gets message from src/js/index.js in channel 'close_app'

  ipcMain.on('close_app', (event, data)=>{
    win.close()
  })
}

// another function that creates a window, but instead loads src/dashboard.html

const createDashboard = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
   
  win.loadFile('src//dashboard.html')
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
const mb = menubar();

mb.on('ready', () => {
  console.log('app is ready');
  // your app code here

// if main.js receives message from src/js/index.js in channel 'msg' then the function
// createDashboard() runs

  ipcMain.on("msg", (event, data)=>{
    if (data === "dash") createDashboard()
  })

  // if main.js receives message from src/js/index.js in channel 'trak', then will run an app to delete/create file on os

  ipcMain.on('trak', (event, data)=>{
    execFile('windowsService//bin//Debug//net7.0//windowsService.exe')

  // for windowsService app, downloaded .net core sdk
})


});