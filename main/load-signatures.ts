import { Stats, stat } from 'fs';
import { resolve } from 'path';
import { exec } from 'child_process';

import { map, filter as asyncFilter, apply, Dictionary } from 'async';

import paths from './../data/paths';
import IpcHandler from "./ipcHandler";
import { SignaturesLocation } from "../data/paths";
import Signature from "./signature";


export class LoadMailSignatureHandler extends IpcHandler {

	private signatureInstances: any/*{[id: string]: Signature}*/ = {};

	constructor(ipc: Electron.IpcMain) {
		super(ipc);
	}

	protected register() {
		this.ipcMain.on('load-signatures', (event) => {
			this.loadSignature(event, (err, data) => {
				if (err) {
					console.error(err);
				}
				event.sender.send('loaded-signatures', err, data);
			});
		});

		this.ipcMain.on('change-signature-lock', (event, filePath, fileName) => {
			let signature = this.signatureInstances[fileName];
			if (signature === undefined || signature === null) {
				event.sender.send('changed-signature-lock', 'Signature instance not found');
				return;
			}
			signature.changeFileLock(apply(event.sender.send('changed-signature-lock')));
		});
	}

	private loadSignature(event, cb) {
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
				cb(err);
				return;
			}
			map(existingLocations, Signature.loadAllSignatures, (err: any, signatures: Signature[][]) => {
				this.signatureInstances = {};
				const flattenedSignatures = [].concat.apply([], signatures);
				flattenedSignatures.forEach((signature) => this.signatureInstances[signature.signatureUniqueId] = signature);
				cb(err, flattenedSignatures);
			});
		});
	}
}
