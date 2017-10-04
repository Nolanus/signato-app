const paths = {
  'local': [
    'Library/Mail/V2/MailData/Signatures', // OS X 10.10
    'Library/Mail/V3/MailData/Signatures', // OS X 10.11
    'Library/Mail/V4/MailData/Signatures', // OS X 10.12
  ],
  'icloud': [
    'Library/Mobile Documents/com~apple~mail/Data/MailData/Signatures',// OS X 10.10
    'Library/Mobile Documents/com~apple~mail/Data/V3/MailData/Signatures', // OS X 10.11
    'Library/Mobile Documents/com~apple~mail/Data/V4/Signatures', // OS X 10.12
  ],
  'os_names': [
    'OS X 10.10',
    'OS X 10.11',
    'OS X 10.12',
  ]
};

export default paths;
