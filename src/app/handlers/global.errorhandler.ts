import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { ElectronService } from '../providers/electron.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {
  }

  handleError(error) {
    const electronService = this.injector.get(ElectronService);
    electronService.remote.dialog.showMessageBox({
      type: 'error',
      message: error.message ? error.message : error.toString(),
      detail: error.stack
    });
    // IMPORTANT: Rethrow the error otherwise it gets swallowed
    throw error;
  }

}
