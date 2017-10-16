import { exec } from 'child_process';
import { dialog } from 'electron';
import IpcHandler from './ipcHandler';

export class CheckMailAppHandler extends IpcHandler {

	private timeout: any;

	constructor(ipcMain: Electron.IpcMain) {
		super(ipcMain);
	}

	protected register() {
		this.checkMailApp(() => {
			this.scheduleMailAppCheck();
		});
	}

	private scheduleMailAppCheck() {
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
		this.timeout = setTimeout(() => {
			this.timeout = undefined;
			this.checkMailApp(() => {
				this.scheduleMailAppCheck();
			});
		}, 1500);
	}

	private checkMailApp(cb: (err: any, running: boolean) => void) {
		exec('ps axo pid,command | awk \'!/grep/ && /Mail\\.app/\' | wc -l', (err, data) => {
			if (err) {
				console.error(err);
				return;
			}
			let running = parseInt(data, 10) > 0;
			if (running) {
				dialog.showMessageBox({
					type: 'warning',
					buttons: ['OK'],
					message: 'Apple Mail running',
					detail: 'Please close Apple Mail to use Signato, as it otherwise interferences on the mail signature files might occur.',
					title: 'Apple Mail running'
				}, () => {
					this.checkMailApp(cb);
				});
			} else {
				cb(err, running);
			}
		});
	}
}
