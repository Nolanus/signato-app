import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { ipcRenderer } from 'electron';

import { ElectronService } from './electron.service';
import Signature from '../../../main/signature';

@Injectable()
export class DataService {

  public signatures: Subject<Signature[]> = new Subject();

  constructor(private electronService: ElectronService) {
    if (!electronService.isElectron()) {
      return;
    }
    this.electronService.ipcRenderer.on('loaded-signatures', (event, err, data) => {
      if (err) {
        console.error(err);
      } else {
        this.signatures.next(data);
      }
    });
    this.electronService.ipcRenderer.on('saved-signature', (event, signatureUniqueId) => {
      this.loadSignatures();
    });
    this.electronService.ipcRenderer.on('changed-signature-lock', (event, signatureUniqueId) => {
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
