import { Component, OnInit, HostBinding } from '@angular/core';
import { ElectronService } from '../../providers/electron.service';

@Component({
	selector: 'app-home',
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
	@HostBinding('class.window-content') windowContentBinding = true;

	title = `App works !`;

	public signatures: any[] = [];
	public signature: any;

	public editorConfig = {
		customConfig: '',
		toolbarGroups: [
			{name: 'document', groups: ['mode', 'document', 'doctools']},
			{name: 'clipboard', groups: ['clipboard', 'undo']},
			{name: 'editing', groups: ['find', 'selection', 'spellchecker', 'editing']},
			{name: 'forms', groups: ['forms']},
			{name: 'basicstyles', groups: ['basicstyles', 'cleanup']},
			{name: 'paragraph', groups: ['list', 'indent', 'blocks', 'align', 'bidi', 'paragraph']},
			{name: 'links', groups: ['links']},
			{name: 'insert', groups: ['insert']},
			{name: 'styles', groups: ['styles']},
			{name: 'colors', groups: ['colors']},
			{name: 'tools', groups: ['tools']},
			{name: 'others', groups: ['others']},
			{name: 'about', groups: ['about']}
		],
		removeButtons: 'Cut,Copy,Paste,Undo,Redo,Anchor,Underline,Strike,Subscript,Superscript',

		// Dialog windows are also simplified.
		removeDialogTabs: 'link:advanced'
	};

	constructor(public electronService: ElectronService) {
	}

	ngOnInit() {
		if (this.electronService.isElectron()) {
			this.loadList();
			this.electronService.ipcRenderer.on('changed-signature-lock', () => this.loadList());
		}
	}

	private loadList() {
		this.electronService.ipcRenderer.on('loaded-signatures', (event, error, data) => {
			this.signatures = data;
		});
		this.electronService.ipcRenderer.send('load-signatures');
	}

	public changeFileLock(location, file) {
		this.electronService.ipcRenderer.send('change-signature-lock', location.path, file.signatureUniqueId, !file.fileLocked);
	}

}
