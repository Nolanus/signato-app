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
var request = require("request");
var ipcHandler_1 = require("./ipcHandler");
var fs_1 = require("fs");
var child_process_1 = require("child_process");
var os_1 = require("os");
var path_1 = require("path");
var fs_2 = require("fs");
var GiveFeedbackHandler = /** @class */ (function (_super) {
    __extends(GiveFeedbackHandler, _super);
    function GiveFeedbackHandler(ipcMain) {
        return _super.call(this, ipcMain) || this;
    }
    GiveFeedbackHandler.prototype.register = function () {
        var _this = this;
        this.logger.info('Registering GiveFeedbackHandler');
        this.ipcMain.on('give-feedback', function (event, feedback, includeLogFile) {
            _this.sendFeedback(feedback, includeLogFile, function (err, data) {
                if (err) {
                    console.error(err);
                }
                event.sender.send('gave-feedback', err, data);
            });
        });
    };
    GiveFeedbackHandler.prototype.sendFeedback = function (feedback, includeLogFile, cb) {
        var _this = this;
        this.logger.info('Sending feedback to getForm, includeLogfile: ' + includeLogFile);
        var logFile = this.logger.transports.file.file || this.logger.transports.file.findLogPath();
        var zipLogFile = path_1.resolve(os_1.tmpdir(), 'log.zip');
        if (!logFile) {
            this.logger.error('No logfile path found');
            cb(new Error('No logfile path found'), null);
            return;
        }
        this.logger.info('Log file is located at ' + logFile + ', will zip to ' + zipLogFile);
        child_process_1.exec('zip -X -j ' + zipLogFile + ' ' + logFile, function (err) {
            if (err) {
                cb(err, null);
                return;
            }
            _this.logger.debug('File zipped successfully');
            var formData = {
                feedback: feedback
            };
            if (includeLogFile) {
                formData.file = fs_1.createReadStream(zipLogFile);
            }
            request.post({
                url: 'https://www.getform.org/u/ffc54d12-e0c5-4140-855a-b88f948c94fa',
                formData: formData
            }, function (err, httpResponse, body) {
                if (err) {
                    _this.logger.error('Error while sending the feedback data:' + err);
                }
                else {
                    _this.logger.info('Feedback send successfully: ' + JSON.stringify(httpResponse));
                }
                if (includeLogFile) {
                    // Unlink the zip log file, but don't wait for that
                    fs_2.unlink(zipLogFile, function (err) {
                        if (err) {
                            _this.logger.error('Error unlinking the log zip file: ' + err);
                        }
                        else {
                            _this.logger.debug('Successfully unlinked the zip log file');
                        }
                    });
                }
                cb(err, body);
            });
        });
    };
    return GiveFeedbackHandler;
}(ipcHandler_1["default"]));
exports.GiveFeedbackHandler = GiveFeedbackHandler;
