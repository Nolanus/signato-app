import { Injectable } from '@angular/core';
import { ipcRenderer, shell} from 'electron';
import * as childProcess from 'child_process';

@Injectable()
export class ElectronService {

  ipcRenderer: typeof ipcRenderer;
  shell: typeof shell;
  childProcess: typeof childProcess;

  constructor() {
    // Conditional imports
    if (this.isElectron()) {
      this.ipcRenderer = window.require('electron').ipcRenderer;
      this.shell = window.require('electron').shell;
      this.childProcess = window.require('child_process');
    }
  }

  isElectron = () => {
    return window && window.process && window.process.type;
  }

}
