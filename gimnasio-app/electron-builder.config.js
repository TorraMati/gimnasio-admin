module.exports = {
  appId: 'com.staymax.admin',
  productName: 'StayMax Admin',
  directories: {
    output: 'dist-electron',
  },
  files: [
    'dist/**/*',
    'electron/**/*',
    'node_modules/**/*',
    'package.json',
  ],
  win: {
    target: 'nsis',
  },
  mac: {
    target: 'dmg',
  },
  linux: {
    target: 'AppImage',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
  },
}
