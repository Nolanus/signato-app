import { Injectable } from '@angular/core';

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import { ipcRenderer, webFrame, shell, remote } from 'electron';

@Injectable()
export class ElectronService {

  ipcRenderer: typeof ipcRenderer;
  webFrame: typeof webFrame;
  shell: typeof shell;
  remote: typeof remote;

  constructor() {
    // Conditional imports
    if (this.isElectron()) {
      this.ipcRenderer = window.require('electron').ipcRenderer;
      this.shell = window.require('electron').shell;
      this.remote = window.require('electron').remote;
      this.webFrame = window.require('electron').webFrame;
    }
  }

  isElectron = () => {
    return window && window.process && window.process.type;
  }

}
