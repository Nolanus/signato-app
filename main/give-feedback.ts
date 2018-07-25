import { dialog } from 'electron';
import IpcHandler from './ipcHandler';
import { exec } from "child_process";
import { tmpdir } from "os";
import { resolve } from "path";

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

    const appleMailCommand = [
      'tell application "Mail"\n' + 'set newMessage to (a reference to (make new outgoing message))\n' + 'tell newMessage\n' + '\tmake new recipient at beginning of to recipients ¬\n' + '\t\twith properties {address:"someone@somewhere.com"}\n' + '\tset the subject to "Signato App Feedback"\n' + '\tset the content to "Please describe your problem here\\n"\n',
      '',
      '\tset visible to true\n' + '\tactivate\n' + 'end tell\n' + 'end tell'];

    if (includeLogFile) {
      const logFile = this.logger.transports.file.file || this.logger.transports.file.findLogPath();
      const zipLogFile = resolve(tmpdir(), 'log.zip');
      if (!logFile) {
        this.logger.error('No logfile path found');
        cb(new Error('No logfile path found'), null);
        return;
      }

      appleMailCommand[1] = '\ttell content\n' +
        '\t\tmake new attachment ¬\n' +
        '\t\t\twith properties {file name:"' + zipLogFile.replace(/(\s+)/g, '\\$1') + '"} ¬\n' +
        '\t\t\tat after the last word of the last paragraph\n' +
        '\tend tell\n';
      this.logger.info('Log file is located at ' + logFile + ', will zip to ' + zipLogFile);

      exec('zip -X -j ' + zipLogFile + ' ' + logFile, (err) => {
        if (err) {
          cb(err, null);
          return;
        }
        this.logger.debug('File zipped successfully');
        this.executeAppleScript(appleMailCommand.join(''), cb);
      });
    } else {
      this.executeAppleScript(appleMailCommand.join(''), cb);
    }
  }

  private executeAppleScript(script, cb) {
    exec('osascript -e \'' + script + '\'', (err) => {
      if (err) {
        cb(err, null);
        return;
      }
      cb(null, null);
    });
  }
}
