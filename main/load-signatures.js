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
var fs_1 = require("fs");
var path_1 = require("path");
var async_1 = require("async");
var paths_1 = require("./../data/paths");
var ipcHandler_1 = require("./ipcHandler");
var signature_1 = require("./signature");
var dialog = require('electron').dialog;
var LoadMailSignatureHandler = /** @class */ (function (_super) {
    __extends(LoadMailSignatureHandler, _super);
    function LoadMailSignatureHandler(ipc) {
        var _this = _super.call(this, ipc) || this;
        _this.signatureInstances = {};
        return _this;
    }
    LoadMailSignatureHandler.prototype.register = function () {
        var _this = this;
        this.logger.info('Registering LoadMailSignatureHandler');
        this.ipcMain.on('load-signatures', function (event) {
            _this.loadSignature(event, function (err, data) {
                if (err) {
                    _this.logger.error(err);
                }
                event.sender.send('loaded-signatures', err, data);
            });
        });
        this.ipcMain.on('change-signature-lock', function (event, filePath, fileName) {
            var signature = _this.signatureInstances[fileName];
            if (signature === undefined || signature === null) {
                event.sender.send('changed-signature-lock', 'Signature instance not found');
                return;
            }
            signature.changeFileLock(function (err, file, locked) {
                event.sender.send('changed-signature-lock', err, file, locked);
            });
        });
        this.ipcMain.on('save-signature', function (event, _signature) {
            if (_signature === undefined || _signature === null) {
                event.sender.send('saved-signature', 'Signature instance not found');
                return;
            }
            var signature = new signature_1["default"](_signature);
            _this.signatureInstances[signature.signatureUniqueId] = signature;
            signature.save(function (err) {
                event.sender.send('saved-signature', err);
                if (err) {
                    dialog.showMessageBox({
                        type: 'error',
                        buttons: ['OK'],
                        message: 'Error while saving signature',
                        detail: err.stack
                    });
                }
                else {
                    dialog.showMessageBox({ type: 'info', buttons: ['OK'], message: 'Signature saved' });
                }
            });
        });
    };
    LoadMailSignatureHandler.prototype.loadSignature = function (event, cb) {
        var _this = this;
        this.logger.info('Start loading signatures from all locations');
        var allLocations = paths_1["default"];
        async_1.filter(allLocations, function (signaturesLocation, filterCb) {
            fs_1.stat(path_1.resolve(process.env.HOME, signaturesLocation.path, 'AllSignatures.plist'), function (err, stats) {
                if (err && err.code !== 'ENOENT') {
                    filterCb(err);
                    return;
                }
                filterCb(null, stats && stats.isFile());
            });
        }, function (err, existingLocations) {
            if (err) {
                _this.logger.error('Error while filtering for existing locations: ' + err);
                cb(err);
                return;
            }
            _this.logger.info('Found ' + existingLocations.length + ' existing signature locations');
            _this.logger.debug(JSON.stringify(existingLocations));
            async_1.map(existingLocations, signature_1["default"].loadAllSignatures, function (mapErr, signatures) {
                _this.signatureInstances = {};
                if (mapErr) {
                    cb(mapErr);
                    return;
                }
                var flattenedSignatures = [].concat.apply([], signatures);
                flattenedSignatures.forEach(function (signature) { return _this.signatureInstances[signature.signatureUniqueId] = signature; });
                cb(null, flattenedSignatures);
            });
        });
    };
    return LoadMailSignatureHandler;
}(ipcHandler_1["default"]));
exports.LoadMailSignatureHandler = LoadMailSignatureHandler;
