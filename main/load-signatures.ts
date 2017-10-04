import { Stats, stat } from 'fs';
import { resolve } from 'path';
import { exec } from 'child_process';

import { map as asyncMap } from 'async';

import paths from './../data/paths';
import AllSignatures from './allSignatures';
import IpcHandler from "./ipcHandler";


export class LoadMailSignatureHandler extends IpcHandler {

	constructor(ipc: Electron.IpcMain) {
		super(ipc);
	}

	private preparePaths(paths): {type: string, os: string, path: string}[] {
		if (paths.local.length === paths.icloud.length && paths.icloud.length === paths.os_names.length) {
			return paths.os_names.reduce((acc, item, index) => {
				acc.push({
					type: 'icloud',
					os: item,
					path: resolve(process.env.HOME, paths.icloud[index])
				});
				acc.push({
					type: 'local',
					os: item,
					path: resolve(process.env.HOME, paths.local[index])
				});
				return acc;
			}, []);
		} else {
			throw 'Path arrays are not of same length';
		}
	};

	protected register() {
		this.ipcMain.on('load-signatures', (event) => {
			this.loadSignature(event, (err, data) => {
				if (err) {
					console.error(err);
				}
				event.sender.send('loaded-signatures', err, data);
			});
		});

		this.ipcMain.on('change-signature-lock', (event, filePath, fileName, lockState) => {
			this.changeFileLock(filePath + '/' + fileName + '.mailsignature', lockState, (err, file, locked) => {
				if (err) {
					console.error(err);
				}
				event.sender.send('changed-signature-lock', err, file, locked);
			});
		});
	}

	private loadSignature(event, cb) {
		const allPaths = this.preparePaths(paths);
		asyncMap(allPaths, (file: any, mapCb) => {
			stat(file.path + '/AllSignatures.plist', (err, stats) => {
				if (err && err.code !== 'ENOENT') {
					mapCb(err);
					return;
				}
				mapCb(null, stats || null);
			});
		}, (err, results: Stats[]) => {
			if (err) {
				cb(err);
				return;
			}
			let folders = [];
			results.forEach((stat, index) => {
				if (stat !== null && stat.isFile()) {
					folders.push(allPaths[index]);
				}
			});
			asyncMap(folders, (folder, mapCb) => {
				const allSigs = new AllSignatures(folder);
				allSigs.load((err) => {
					if (err) {
						mapCb(err);
						return;
					}
					folder.signatures = allSigs.signatures;
					mapCb(null, folder);
				});
			}, cb);
		});
	}

	private changeFileLock(file: string, locked: boolean, cb) {
		exec('chflags ' + (locked ? '' : 'no') + 'uchg "' + file + '"', (err) => {
			cb(err, file, locked);
		});
	}
}
