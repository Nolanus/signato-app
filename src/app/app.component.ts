import { Component, ViewChild, ElementRef } from '@angular/core';
import { ElectronService } from './providers/electron.service';
import { DataService } from "./providers/data.service";
import { ModalDirective } from "./directives/modal.directive";

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {
	@ViewChild(ModalDirective) private feedbackDialog: ModalDirective;

	public feedbackForm = {text: '', includeLogFile: false};
	public feedbackStatus: number = 0;

	constructor(public electronService: ElectronService, private dataService: DataService) {

		if (electronService.isElectron()) {
			console.log('Mode electron');
			// Check if electron is correctly injected (see externals in webpack.config.js)
			console.log('c', electronService.ipcRenderer);
			// Check if nodeJs childProcess is correctly injected (see externals in webpack.config.js)
			console.log('c', electronService.childProcess);

			electronService.ipcRenderer.on('mail-app', (event, running) => {
				console.log('Mail app is' + (running ? '' : ' not') + ' running');

				// TODO Depending on the running value overlay the whole app with a dialog

			});

			electronService.ipcRenderer.on('gave-feedback', (event, err, data) => {
				if (err) {
					console.error(err);
				}
				this.feedbackStatus = 2;
				setTimeout(() => {
					this.feedbackDialog.close();
					this.feedbackStatus = 0;
					this.feedbackForm.text = '';
				}, 1000);
			});
		} else {
			console.log('Mode web');
		}
	}

	public reloadSignatures() {
		this.dataService.loadSignatures();
	}

	public openFeedbackPane() {
		if (this.feedbackStatus === 0) {
			//All settings are optional
			this.feedbackDialog.toggle();
		}
	}

	public sendFeedback() {
		this.feedbackStatus = 1;
		this.electronService.ipcRenderer.send('give-feedback', this.feedbackForm.text, this.feedbackForm.includeLogFile);
	}

	public openGitHub() {
		this.electronService.shell.openExternal('https://github.com/Nolanus/signato-app/issues/new')
	}
}
