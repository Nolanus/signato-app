import { dialog } from 'electron';
import  * as request from 'request';
import IpcHandler from './ipcHandler';
import { createReadStream } from 'fs';
import { exec } from "child_process";
import { tmpdir } from "os";
import { resolve } from "path";
import { unlink } from "fs";

export class GiveFeedbackHandler extends IpcHandler {

  constructor(ipcMain: Electron.IpcMain) {
    super(ipcMain);
  }

  protected register() {
    this.logger.info('Registering GiveFeedbackHandler');
    this.ipcMain.on('give-feedback', (event, feedback: string, includeLogFile: boolean) => {

      this.sendFeedback(feedback, includeLogFile, (err, data) => {
        if (err) {
          console.error(err);
        }
        event.sender.send('gave-feedback', err, data);
      });
    });
  }

  private sendFeedback(feedback: string, includeLogFile: boolean, cb: (error: any, body: string) => void) {
    this.logger.info('Sending feedback to getForm, includeLogfile: ' + includeLogFile);
    const logFile = this.logger.transports.file.file || this.logger.transports.file.findLogPath();
    const zipLogFile = resolve(tmpdir(), 'log.zip');
    if (!logFile) {
      this.logger.error('No logfile path found');
      cb(new Error('No logfile path found'), null);
      return;
    }
    this.logger.info('Log file is located at ' + logFile + ', will zip to ' + zipLogFile);
    exec('zip -X -j ' + zipLogFile + ' ' + logFile, (err) => {
      if (err) {
        cb(err, null);
        return;
      }
      this.logger.debug('File zipped successfully');
      const formData: {feedback: string, file?: any} = {
        feedback
      };
      if (includeLogFile) {
        formData.file = createReadStream(zipLogFile);
      }

      request.post({
        url: 'https://www.getform.org/u/ffc54d12-e0c5-4140-855a-b88f948c94fa',
        formData
      }, (err, httpResponse, body) => {
        if (err) {
          this.logger.error('Error while sending the feedback data:' + err);
        } else {
          this.logger.info('Feedback send successfully: ' + JSON.stringify(httpResponse));
        }
        if (includeLogFile) {
          // Unlink the zip log file, but don't wait for that
          unlink(zipLogFile, (err) => {
            if (err) {
              this.logger.error('Error unlinking the log zip file: ' + err);
            } else {
              this.logger.debug('Successfully unlinked the zip log file');
            }
          });
        }
        cb(err, body);
      });
    });

  }
}
