/// <reference types="node" />
import type Settings from '../frontend/node_modules/@nodelib/fs.scandir/out/settings';
import type { Entry } from '../frontend/node_modules/@nodelib/fs.scandir/out/types';
export declare type AsyncCallback = (error: NodeJS.ErrnoException, entries: Entry[]) => void;
export declare function read(directory: string, settings: Settings, callback: AsyncCallback): void;
export declare function readdirWithFileTypes(directory: string, settings: Settings, callback: AsyncCallback): void;
export declare function readdir(directory: string, settings: Settings, callback: AsyncCallback): void;
