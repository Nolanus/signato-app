import { Component, ViewChild } from '@angular/core';
import { ElectronService } from './providers/electron.service';
import { DataService } from './providers/data.service';
import { ModalDirective } from './directives/modal.directive';
import { TranslateService } from '@ngx-translate/core';
import { AppConfig } from './app.config';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  @ViewChild(ModalDirective) public feedbackDialog: ModalDirective;

  public appTitle = 'Signato';
  public feedbackForm = {text: '', includeLogFile: false};
  public feedbackStatus = 0;

  constructor(public electronService: ElectronService, private dataService: DataService,
              private translate: TranslateService) {

    // this language will be used as a fallback when a translation isn't found in the current language
    translate.setDefaultLang('en');

    // the lang to use, if the lang isn't available, it will use the current loader to get them
    translate.use('en');

    if (electronService.isElectron()) {
      console.log('Mode electron');
      this.appTitle = this.appTitle.concat(' ', electronService.remote.app.getVersion());

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
      this.feedbackDialog.toggle();
    }
  }

  public sendFeedback() {
    this.feedbackStatus = 1;
    this.electronService.ipcRenderer.send('give-feedback', this.feedbackForm.text, this.feedbackForm.includeLogFile);
  }

  public openGitHub() {
    this.electronService.shell.openExternal('https://github.com/Nolanus/signato-app/issues/new');
  }
}
