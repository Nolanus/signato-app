import { SignatureType } from '../main/signature';

const paths = {
  'local': [
    'Library/Mail/V2/MailData/Signatures', // OS X 10.7/10.8/10.9/10.10
    'Library/Mail/V3/MailData/Signatures', // OS X 10.11
    'Library/Mail/V4/MailData/Signatures', // OS X 10.12
    'Library/Mail/V5/MailData/Signatures', // OS X 10.13
    'Library/Mail/V6/MailData/Signatures', // OS X 10.14
  ],
  'icloud': [
    'Library/Mobile Documents/com~apple~mail/Data/MailData/Signatures', // OS X 10.7/10.8/10.9/10.10
    'Library/Mobile Documents/com~apple~mail/Data/V3/MailData/Signatures', // OS X 10.11
    'Library/Mobile Documents/com~apple~mail/Data/V4/Signatures', // OS X 10.12/10.13/10.14
  ],
  'os_names': [
    'OS X 10.7/10.8/10.9/10.10',
    'OS X 10.11',
    'OS X 10.12',
    'OS X 10.13',
  ]
};

function mapper(type: SignatureType) {
  return (path, index): SignaturesLocation => {
    return {path, type, os: paths.os_names[index]};
  };
}

export interface SignaturesLocation {
  path: string;
  type: SignatureType;
  os: string;
}

export default [
  ...paths.icloud.map(mapper(SignatureType.ICLOUD)),
  ...paths.local.map(mapper(SignatureType.LOCALE))
];
