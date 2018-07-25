import { app, BrowserWindow, screen, ipcMain, dialog, Menu, shell } from 'electron';
import { existsSync } from 'fs';
import { resolve } from 'path';
import * as log from 'electron-log';

import { LoadMailSignatureHandler } from './main/load-signatures';
import { CheckMailAppHandler } from './main/check-mailapp';
import { GiveFeedbackHandler } from './main/give-feedback';
import { join as pathJoin } from 'path';
import { format as urlFormat } from 'url';
import { homedir } from 'os';

let win, serve, debugMode = false;
const args = process.argv.slice(1);
serve = args.some(val => val === '--serve');

if (!serve) {
  if (existsSync(resolve(pathJoin(homedir(), 'Desktop'), 'SIGNATO_DEBUG'))) {
    log.transports.file.level = 'debug';
    debugMode = true;
    log.info('Found DEBUG file, so will log everything into the file');
  }
}
log.info('Starting Signato');
try {
  require('dotenv').config();
} catch {
  console.log('asar');
}

function createWindow() {

  const electronScreen = screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;

  const loadMailSignatureHandler = new LoadMailSignatureHandler(ipcMain);
  const checkMailAppHandler = new CheckMailAppHandler(ipcMain);
  const giveFeedbackHandler = new GiveFeedbackHandler(ipcMain);

  if (debugMode) {
    dialog.showMessageBox({
      type: 'info',
      buttons: ['OK'],
      message: 'Debug Mode enabled',
      detail: 'Signato is now running in Debug Mode with more verbose logging messages. Remove the "SIGNATO_DEBUG" file/folder on your desktop and restart to run in normal mode.',
      title: 'Debug Mode enabled'
    }, () => {
      // Just a dummy callback to not block the process
    });
  }

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    minWidth: 500,
    minHeight: 200,
    acceptFirstMouse: true,
    titleBarStyle: 'hidden',
    frame: false
  });

  // Check if we are on a MAC
  if (process.platform === 'darwin') {
    // Create our menu entries so that we can use MAC shortcuts
    Menu.setApplicationMenu(Menu.buildFromTemplate([{
      label: app.getName(),
      submenu: [
        {role: 'about'},
        {type: 'separator'},
        {role: 'services', submenu: []},
        {type: 'separator'},
        {role: 'hide'},
        {role: 'hideothers'},
        {role: 'unhide'},
        {type: 'separator'},
        {
          label: 'Quit ' + app.getName(), accelerator: 'Command+Q', click() {
          app.quit()
        }
        }
      ]
    },
      {
        label: 'Edit',
        submenu: [
          {role: 'undo'},
          {role: 'redo'},
          {type: 'separator'},
          {role: 'cut'},
          {role: 'copy'},
          {role: 'paste'},
          {role: 'pasteandmatchstyle'},
          {role: 'delete'},
          {role: 'selectall'}
        ]
      },
      {
        role: 'window',
        submenu: [
          {role: 'minimize'},
          {role: 'close'},
          {type: 'separator'},
          {
            label: 'Toggle Developer Tools',
            accelerator: 'Command+Alt+I',
            click: (menuItem, browserWindow) => {
              browserWindow.webContents.toggleDevTools();
            },
          },
          {
            label: 'Reload',
            accelerator: 'Command+Shift+R',
            click: () => {
              win.reload();
            },
          }
        ]
      },
      {
        role: 'help',
        submenu: [
          {
            label: 'See latest releases',
            click() {
              shell.openExternal('https://github.com/Nolanus/signato-app/releases')
            }
          },
          {
            label: 'Readme',
            click() {
              shell.openExternal('https://github.com/Nolanus/signato-app#readme')
            }
          }
        ]
      }
    ]));
  }

  // and load the index.html of the app.
  if (serve) {
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`)
    });
    win.loadURL('http://localhost:4200');
  } else {
    win.loadURL(urlFormat({
      pathname: pathJoin(__dirname, 'dist/index.html'),
      protocol: 'file:',
      slashes: true
    }));
  }

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });
}

try {

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', createWindow);

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

} catch (e) {
  // Catch Error
  // throw e;
}
