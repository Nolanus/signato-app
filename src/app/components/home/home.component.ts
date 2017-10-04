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

    public locations: any[] = [];
    public signature: any;

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
            this.locations = data;
        });
        this.electronService.ipcRenderer.send('load-signatures');
    }

    public changeFileLock(location, file) {
        this.electronService.ipcRenderer.send('change-signature-lock', location.path, file.signatureUniqueId, !file.fileLocked);
    }

}
