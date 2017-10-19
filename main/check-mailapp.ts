import { exec } from 'child_process';
import { dialog } from 'electron';
import IpcHandler from './ipcHandler';

export class CheckMailAppHandler extends IpcHandler {

	private timeout: any;

	constructor(ipcMain: Electron.IpcMain) {
		super(ipcMain);
	}

	protected register() {
		this.logger.info('Registering CheckMailAppHandler');
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

	private checkMailApp(cb: (err: any, running?: boolean) => void) {
		// Mail.app/Contents/MacOS/Mail
		exec("ps axo pid,command | awk '!/grep/ && /Mail\\.app\\/Contents\\/MacOS\\/Mail/'", (err, data) => {
			if (err) {
				this.logger.error(err);
				cb(err);
				return;
			}
			let running = data.split(/\r\n|\r|\n/).length > 1;
			if (running) {
				this.logger.warn('Detected running MailApp: ' + JSON.stringify(data));
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
