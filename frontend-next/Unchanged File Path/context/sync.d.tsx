import type Settings from '../frontend/node_modules/@nodelib/fs.scandir/out/settings';
import type { Entry } from '../frontend/node_modules/@nodelib/fs.scandir/out/types';
export declare function read(directory: string, settings: Settings): Entry[];
export declare function readdirWithFileTypes(directory: string, settings: Settings): Entry[];
export declare function readdir(directory: string, settings: Settings): Entry[];
