import * as path from 'path';

const MonarcRootPath = process.env.NODE_ENV === 'development'
  ? path.resolve(__dirname, '../../')
  : path.resolve(__dirname, '../');
const MonarcHelperPath = process.env.NODE_ENV === 'development'
  ? path.resolve(MonarcRootPath, 'src', 'helper')
  : path.resolve(MonarcRootPath, 'dist');
const MonarcPreloadPath = process.env.NODE_ENV === 'development'
  ? `http://localhost:${require('../../.electron-vue/config').port}`
  : path.resolve(MonarcRootPath, 'dist');

export default {
  MonarcRootPath,
  MonarcHelperPath,
  MonarcPreloadPath,
  devUserData: `${path.resolve(MonarcRootPath, 'userData')}`,
  testUserData: `${path.resolve(MonarcRootPath, 'test', 'userData')}`,
  MonarcPagesCustomProtocol: 'Monarc',
  MonarcPDFJSPath: `${path.resolve(MonarcHelperPath, 'pdfjs')}`,
  MonarcRev: 'c3a3ffb5c4dcdd688c886d5f20f542379064ad2c',
};
