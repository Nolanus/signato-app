import { dialog } from 'electron';
import  * as request from 'request';
import IpcHandler from './ipcHandler';

export class GiveFeedbackHandler extends IpcHandler {

	constructor(ipcMain: Electron.IpcMain) {
		super(ipcMain);
	}

	protected register() {
		this.ipcMain.on('give-feedback', (event, feedback) => {

			this.sendFeedback(feedback, (err, data) => {
				if (err) {
					console.error(err);
				}
				event.sender.send('gave-feedback', err, data);
			});
		});
	}

	private sendFeedback(feedback, cb) {
		request.post({
			url: 'https://www.getform.org/f/872b9be7-b839-4298-b38c-6323a6b4b044',
			form: {feedback}
		}, function (err, httpResponse, body) { /* ... */
			cb(err, body);
		});
	}

}



