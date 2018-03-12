"use strict";
exports.__esModule = true;
/**
 * Created by sebastian.fuss on 04.10.17.
 */
var logger = require("electron-log");
var IpcHandler = /** @class */ (function () {
    function IpcHandler(ipcMain) {
        this.ipcMain = ipcMain;
        this.logger = logger;
        this.register();
    }
    return IpcHandler;
}());
exports["default"] = IpcHandler;
