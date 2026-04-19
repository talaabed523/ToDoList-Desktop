const { app, BrowserWindow } = require('electron')
const path = require('path')
const { fork } = require('child_process')

app.disableHardwareAcceleration()

if (require('electron-squirrel-startup')) app.quit();

let serverProcess = null;

function startServer() {
  serverProcess = fork(path.join(__dirname, 'server.js'))

  serverProcess.on('error', (err) => {
    console.error('Server process error:', err)
  })

  serverProcess.on('exit', (code) => {
    console.error('Server process exited with code:', code)
  })
}

function createWindow() {
  const win = new BrowserWindow({
    width: 950,
    height: 750,
    icon: path.join(__dirname, 'ToDoList_Icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    title: "To Do List",
    autoHideMenuBar: true,
    show: false
  })

  win.loadFile('index.html')

  win.once('ready-to-show', () => {
    win.show()
  })
}

app.whenReady().then(() => {
  startServer()
  createWindow()
})

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill()
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})