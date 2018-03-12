"use strict";
exports.__esModule = true;
var signature_1 = require("../main/signature");
var paths = {
    'local': [
        'Library/Mail/V2/MailData/Signatures',
        'Library/Mail/V3/MailData/Signatures',
        'Library/Mail/V4/MailData/Signatures',
    ],
    'icloud': [
        'Library/Mobile Documents/com~apple~mail/Data/MailData/Signatures',
        'Library/Mobile Documents/com~apple~mail/Data/V3/MailData/Signatures',
        'Library/Mobile Documents/com~apple~mail/Data/V4/Signatures',
    ],
    'os_names': [
        'OS X 10.7/10.8/10.9/10.10',
        'OS X 10.11',
        'OS X 10.12/10.13',
    ]
};
function mapper(type) {
    return function (path, index) {
        return { path: path, type: type, os: paths.os_names[index] };
    };
}
exports["default"] = paths.icloud.map(mapper(signature_1.SignatureType.ICLOUD)).concat(paths.local.map(mapper(signature_1.SignatureType.LOCALE)));
