"use strict";
exports.__esModule = true;
var fs_1 = require("fs");
var utf8_1 = require("utf8");
var path_1 = require("path");
var child_process_1 = require("child_process");
var fast_plist_1 = require("fast-plist");
var quoted_printable_1 = require("quoted-printable");
var async_1 = require("async");
var logger = require("electron-log");
var SignatureType;
(function (SignatureType) {
    SignatureType[SignatureType["LOCALE"] = 0] = "LOCALE";
    SignatureType[SignatureType["ICLOUD"] = 1] = "ICLOUD";
})(SignatureType = exports.SignatureType || (exports.SignatureType = {}));
var Signature = /** @class */ (function () {
    function Signature(signature, allSignaturesEntry, fileLocked, accountURLs, signatureFileContents) {
        if (signature.signatureUniqueId !== undefined) {
            // It is a Signature object, but propaly on only containing data, no methods
            var sourceSignature = signature;
            this.type = sourceSignature.type;
            this.path = sourceSignature.path;
            this.os = sourceSignature.os;
            this.signatureIsRich = sourceSignature.signatureIsRich;
            this.signatureName = sourceSignature.signatureName;
            this.signatureUniqueId = sourceSignature.signatureUniqueId;
            this._fileLocked = sourceSignature._fileLocked;
            this.messageId = sourceSignature.messageId;
            this.encoding = sourceSignature.encoding;
            this.mimeVersion = sourceSignature.mimeVersion;
            this.content = sourceSignature.content;
            this.accountURLs = sourceSignature.accountURLs;
        }
        else if (allSignaturesEntry && fileLocked !== undefined && signatureFileContents) {
            var signatureLocation = signature;
            this.path = signatureLocation.path;
            this.os = signatureLocation.os;
            this.type = signatureLocation.type;
            this.signatureIsRich = allSignaturesEntry.SignatureIsRich;
            this.signatureName = allSignaturesEntry.SignatureName;
            this.signatureUniqueId = allSignaturesEntry.SignatureUniqueId;
            this._fileLocked = fileLocked;
            var trimmed = signatureFileContents.trim();
            var encoding = trimmed.match(/^Content-Transfer-Encoding: (.+)$/im);
            var messageId = trimmed.match(/^Message-Id: <([^>]+)>$/im);
            var mimeVersion = trimmed.match(/Mime-Version: (.*)+/im);
            // let content = trimmed.match(/^$([\s\S]*)/im);
            var content = trimmed.split('\n').reduce(function (acc, line) {
                if (acc.contentSection) {
                    acc.content = acc.content.concat(line, '\n');
                }
                else if (line.trim().length === 0) {
                    acc.contentSection = true;
                }
                return acc;
            }, { contentSection: false, content: '' }).content;
            if (encoding === null || messageId === null || mimeVersion === null || content === undefined || content.length === 0) {
                logger.debug('encoding: ' + JSON.stringify(encoding));
                logger.debug('messageId: ' + JSON.stringify(messageId));
                logger.debug('mimeVersion: ' + JSON.stringify(mimeVersion));
                logger.debug('MailSignature content is ' + signatureFileContents.trim());
                throw new Error('Illegal argument, not a valid mailsignature file content');
            }
            this.messageId = messageId[1];
            this.encoding = encoding[1];
            this.mimeVersion = mimeVersion[1];
            this.content = encoding[1] === 'quoted-printable' ? utf8_1.decode(quoted_printable_1.decode(content)).trim() : content.trim();
            this.accountURLs = accountURLs || [];
        }
        else {
            logger.warn('Tried to create a signature with insufficient data provided: ' + JSON.stringify(arguments));
            throw new Error('Tried to create a signature with insufficient data provided');
        }
    }
    Signature.loadAllSignatures = function (signaturesLocation, cb) {
        async_1.map([
            path_1.resolve(process.env.HOME, signaturesLocation.path, 'AllSignatures.plist'),
            path_1.resolve(process.env.HOME, signaturesLocation.path, 'AccountsMap.plist')
        ], function (filename, mapCb) {
            fs_1.readFile(filename, 'utf8', function (err, contents) {
                if (err) {
                    mapCb(err);
                    return;
                }
                mapCb(null, fast_plist_1.parse(contents));
            });
        }, function (err, _a) {
            var allSignatures = _a[0], accountsMap = _a[1];
            if (err) {
                cb(err);
                return;
            }
            logger.debug('Loaded allSignatures file contents:');
            logger.debug(JSON.stringify(allSignatures));
            logger.debug('Loaded AccountsMap file contents:');
            logger.debug(JSON.stringify(accountsMap));
            if (!Array.isArray(allSignatures)) {
                cb(new Error('Illegal argument, not a valid AllSignatures.plist file content'));
                return;
            }
            // Prepare a nice data structure to read mappings from the accounts file
            var signature2Accounts = Object.keys(accountsMap).reduce(function (acc, key) {
                var assignment = accountsMap[key];
                assignment.Signatures.reduce(function (sigAcc, signatureUniqueId) {
                    if (!sigAcc[signatureUniqueId]) {
                        sigAcc[signatureUniqueId] = [];
                    }
                    sigAcc[signatureUniqueId].push(decodeURIComponent(assignment.AccountURL));
                    return sigAcc;
                }, acc);
                return acc;
            }, {});
            async_1.map(allSignatures, function (allSignaturesEntry, mapCb) {
                if (!allSignaturesEntry.SignatureUniqueId || !allSignaturesEntry.SignatureName ||
                    allSignaturesEntry.SignatureIsRich === undefined) {
                    mapCb(new Error('Illegal argument, not a valid AllSignatures.plist file content'));
                }
                var signatureFilePath = path_1.resolve(process.env.HOME, signaturesLocation.path, allSignaturesEntry.SignatureUniqueId + '.mailsignature');
                // Test whether we can write the file (the uchg flag is not set)
                fs_1.access(signatureFilePath, fs_1.constants.W_OK, function (accessErr) {
                    fs_1.readFile(signatureFilePath, 'utf8', function (readErr, sigFileContent) {
                        if (readErr) {
                            logger.error('Error reading file ' + signatureFilePath + ' skipping it (' + readErr + ')');
                            cb(null, null);
                            return;
                        }
                        try {
                            var signature = new Signature(signaturesLocation, allSignaturesEntry, accessErr !== null, signature2Accounts[allSignaturesEntry.SignatureUniqueId], sigFileContent);
                            mapCb(null, signature);
                        }
                        catch (ex) {
                            logger.warn('Unable to parse ' + signatureFilePath + ': ' + ex);
                            // We can't parse that signature file, so skip it. We later remove all "null" entries from the array
                            mapCb(null, null);
                        }
                    });
                });
            }, function (mapErr, result) {
                if (mapErr) {
                    cb(mapErr);
                    return;
                }
                // Send an array with all non-null values to the callback
                cb(null, result.filter(function (item) { return item !== null; }));
            });
        });
    };
    Signature.prototype.fileLocked = function () {
        return this._fileLocked;
    };
    Signature.prototype.filePath = function () {
        return path_1.resolve(process.env.HOME, this.path, this.signatureUniqueId + '.mailsignature');
    };
    Signature.prototype.changeFileLock = function (cb) {
        var _this = this;
        var file = this.filePath();
        logger.debug('Changing file lock for ' + file + ', is currently ' + this._fileLocked);
        child_process_1.exec('chflags ' + (!this._fileLocked ? '' : 'no') + 'uchg "' + file + '"', function (err) {
            if (!err) {
                _this._fileLocked = !_this._fileLocked;
                logger.debug('Changed file flag without error');
            }
            else {
                logger.error('Error while changing file lock: ' + err);
            }
            cb(err, file, _this._fileLocked);
        });
    };
    Signature.prototype.checkFileLock = function (cb) {
        logger.debug('About to check file write access for  ' + this.filePath());
        fs_1.access(this.filePath(), fs_1.constants.W_OK, function (accessErr) {
            logger.debug('File write check produced: ' + accessErr);
            cb(null, accessErr !== null);
        });
    };
    Signature.prototype.writeFile = function (cb) {
        logger.debug('Writing new signature file contents to ' + this.filePath());
        fs_1.writeFile(this.filePath(), 'Content-Transfer-Encoding: 7bit\n' +
            'Content-Type: text/html;\n' +
            '	charset=us-ascii\n' +
            'Message-Id: <' + this.messageId + '>\n' +
            'Mime-Version: ' + this.mimeVersion + '\n' +
            '\n' +
            this.content.replace(/\r?\n|\r/g, ''), { encoding: 'utf8' }, cb);
    };
    Signature.prototype.save = function (callback) {
        var _this = this;
        async_1.waterfall([
            function (cb) { return _this.checkFileLock(cb); },
            function (fileLocked, cb) {
                if (fileLocked) {
                    _this.changeFileLock(function () { return cb(null); });
                }
                else {
                    cb(null);
                }
            },
            function (cb) { return _this.writeFile(cb); },
            function (cb) {
                if (_this.type === SignatureType.LOCALE) {
                    // we need to lock locale files
                    _this.changeFileLock(cb);
                }
                else {
                    // iCloud files do not need to be locked
                    cb(null);
                }
            }
        ], function (err, result) {
            if (err) {
                logger.error('Error while saving new signature: ' + err);
            }
            else {
                logger.info('File ' + _this.filePath() + ' saved without errors');
            }
            callback(err, _this.signatureUniqueId);
        });
    };
    return Signature;
}());
exports["default"] = Signature;
