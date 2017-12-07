import { Stats, stat } from 'fs';
import { resolve } from 'path';

import { map, filter as asyncFilter } from 'async';

import paths from './../data/paths';
import IpcHandler from './ipcHandler';
import { SignaturesLocation } from '../data/paths';
import Signature from './signature';

const {dialog} = require('electron');


export class LoadMailSignatureHandler extends IpcHandler {

  private signatureInstances: { [id: string]: Signature } = {};

  constructor(ipc: Electron.IpcMain) {
    super(ipc);
  }

  protected register() {
    this.logger.info('Registering LoadMailSignatureHandler');
    this.ipcMain.on('load-signatures', (event) => {
      this.loadSignature(event, (err, data) => {
        if (err) {
          this.logger.error(err);
        }
        event.sender.send('loaded-signatures', err, data);
      });
    });

    this.ipcMain.on('change-signature-lock', (event, filePath, fileName) => {
      const signature = this.signatureInstances[fileName];
      if (signature === undefined || signature === null) {
        event.sender.send('changed-signature-lock', 'Signature instance not found');
        return;
      }
      signature.changeFileLock((err: any, file: string, locked: boolean) => {
        event.sender.send('changed-signature-lock', err, file, locked);
      });
    });

    this.ipcMain.on('save-signature', (event, _signature: Signature) => {
      if (_signature === undefined || _signature === null) {
        event.sender.send('saved-signature', 'Signature instance not found');
        return;
      }
      const signature = new Signature(_signature);
      this.signatureInstances[signature.signatureUniqueId] = signature;

      signature.save((err: any) => {
        event.sender.send('saved-signature', err);
        if (err) {
          dialog.showMessageBox({
            type: 'error',
            buttons: ['OK'],
            message: 'Error while saving signature',
            detail: err.stack
          });
        } else {
          dialog.showMessageBox({type: 'info', buttons: ['OK'], message: 'Signature saved'});
        }
      });
    });
  }

  private loadSignature(event, cb) {
    this.logger.info('Start loading signatures from all locations');
    const allLocations = paths;

    asyncFilter(allLocations, (signaturesLocation: SignaturesLocation, filterCb) => {
      stat(resolve(process.env.HOME, signaturesLocation.path, 'AllSignatures.plist'), (err, stats) => {
        if (err && err.code !== 'ENOENT') {
          filterCb(err);
          return;
        }
        filterCb(null, stats && stats.isFile());
      });
    }, (err, existingLocations: SignaturesLocation[]) => {
      if (err) {
        this.logger.error('Error while filtering for existing locations: ' + err);
        cb(err);
        return;
      }
      this.logger.info('Found ' + existingLocations.length + ' existing signature locations');
      this.logger.debug(JSON.stringify(existingLocations));
      map(existingLocations, Signature.loadAllSignatures, (mapErr: any, signatures: Signature[][]) => {
        this.signatureInstances = {};
        if (mapErr) {
          cb(mapErr);
          return;
        }
        const flattenedSignatures = [].concat.apply([], signatures);
        flattenedSignatures.forEach((signature) => this.signatureInstances[signature.signatureUniqueId] = signature);
        cb(null, flattenedSignatures);
      });
    });
  }
}
