"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var child_process_1 = require("child_process");
var electron_1 = require("electron");
var ipcHandler_1 = require("./ipcHandler");
var CheckMailAppHandler = /** @class */ (function (_super) {
    __extends(CheckMailAppHandler, _super);
    function CheckMailAppHandler(ipcMain) {
        return _super.call(this, ipcMain) || this;
    }
    CheckMailAppHandler.prototype.register = function () {
        var _this = this;
        this.logger.info('Registering CheckMailAppHandler');
        this.checkMailApp(function () {
            _this.scheduleMailAppCheck();
        });
    };
    CheckMailAppHandler.prototype.scheduleMailAppCheck = function () {
        var _this = this;
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        this.timeout = setTimeout(function () {
            _this.timeout = undefined;
            _this.checkMailApp(function () {
                _this.scheduleMailAppCheck();
            });
        }, 1500);
    };
    CheckMailAppHandler.prototype.checkMailApp = function (cb) {
        var _this = this;
        // Mail.app/Contents/MacOS/Mail
        child_process_1.exec("ps axo pid,command | awk '!/grep/ && /Mail\\.app\\/Contents\\/MacOS\\/Mail/'", function (err, data) {
            if (err) {
                _this.logger.error(err);
                cb(err);
                return;
            }
            var running = data.split(/\r\n|\r|\n/).length > 1;
            if (running) {
                _this.logger.warn('Detected running MailApp: ' + JSON.stringify(data));
                electron_1.dialog.showMessageBox({
                    type: 'warning',
                    buttons: ['OK'],
                    message: 'Apple Mail running',
                    detail: 'Please close Apple Mail to use Signato, as it otherwise interferences on the mail signature files might occur.',
                    title: 'Apple Mail running'
                }, function () {
                    _this.checkMailApp(cb);
                });
            }
            else {
                cb(err, running);
            }
        });
    };
    return CheckMailAppHandler;
}(ipcHandler_1["default"]));
exports.CheckMailAppHandler = CheckMailAppHandler;
