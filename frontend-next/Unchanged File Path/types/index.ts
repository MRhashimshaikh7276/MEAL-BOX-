type indexBrowserType = typeof import("./index-browser.js");
type indexType = typeof import("./index");

// Kind of gross, but essentially asserting that the exports of this module are the same as the
// exports of index-browser, since this file may be replaced at bundle time with index-browser.
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
({}) as any as indexBrowserType as indexType;

export { findPackageData } from '../frontend/node_modules/@babel/core/src/config/files/package.js';

export {
  findConfigUpwards,
  findRelativeConfig,
  findRootConfig,
  loadConfig,
  resolveShowConfigPath,
  ROOT_CONFIG_FILENAMES,
} from '../frontend/node_modules/@babel/core/src/config/files/configuration.js';
export type {
  ConfigFile,
  IgnoreFile,
  RelativeConfig,
  FilePackageData,
} from '../frontend/node_modules/@babel/core/src/config/files/types.js';
export {
  loadPlugin,
  loadPreset,
  resolvePlugin,
  resolvePreset,
} from '../frontend/node_modules/@babel/core/src/config/files/plugins.js';
