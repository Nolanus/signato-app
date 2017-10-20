import { Injectable } from '@angular/core';
import { ipcRenderer, shell, remote } from 'electron';

@Injectable()
export class ElectronService {

  ipcRenderer: typeof ipcRenderer;
  shell: typeof shell;
  remote: typeof remote;

  constructor() {
    // Conditional imports
    if (this.isElectron()) {
      this.ipcRenderer = window.require('electron').ipcRenderer;
      this.shell = window.require('electron').shell;
      this.remote = window.require('electron').remote;
    }
  }

  isElectron = () => {
    return window && window.process && window.process.type;
  }

}
