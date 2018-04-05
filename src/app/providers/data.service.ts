import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { ipcRenderer } from 'electron';
import { NgZone } from '@angular/core';

import { ElectronService } from './electron.service';
import Signature from '../../../main/signature';

@Injectable()
export class DataService {

  public signatures: Subject<Signature[]> = new ReplaySubject(1);

  constructor(private electronService: ElectronService, private zone: NgZone) {
    if (!electronService.isElectron()) {
      return;
    }
    this.electronService.ipcRenderer.on('loaded-signatures', (event, err, data) => {
      if (err) {
        this.electronService.remote.dialog.showMessageBox({type: 'error', message: 'Error while loading signatures', detail: JSON.stringify(err)});
        console.error(err);
      } else {
        this.zone.run(() =>
          this.signatures.next(data)
        );
      }
    });
    this.electronService.ipcRenderer.on('saved-signature', (event, signatureUniqueId) => {
      this.loadSignatures();
    });
    this.electronService.ipcRenderer.on('changed-signature-lock', (event, err, file, locked) => {
      this.loadSignatures();
    });
  }

  public loadSignatures() {
    if (!this.electronService.isElectron()) {
      return;
    }
    return this.electronService.ipcRenderer.send('load-signatures');
  }

  public saveSignature(signature: Signature) {
    if (!this.electronService.isElectron()) {
      return;
    }
    this.electronService.ipcRenderer.send('save-signature', signature);
  }

  public changeSignatureFileLock(signature: Signature) {
    if (!this.electronService.isElectron()) {
      return;
    }
    this.electronService.ipcRenderer.send('change-signature-lock', signature.path, signature.signatureUniqueId);
  }
}
