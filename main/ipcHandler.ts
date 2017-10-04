/**
 * Created by sebastian.fuss on 04.10.17.
 */

export default abstract class IpcHandler {

  protected ipcMain: Electron.IpcMain;

  constructor(ipcMain: Electron.IpcMain) {
    this.ipcMain = ipcMain;
    this.register();
  }

  protected abstract register();
}
