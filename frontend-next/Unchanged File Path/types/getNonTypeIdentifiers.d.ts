import type { Options } from '../frontend/node_modules/sucrase/dist/types/index';
import type TokenProcessor from '../frontend/node_modules/sucrase/dist/types/TokenProcessor';
export declare function getNonTypeIdentifiers(tokens: TokenProcessor, options: Options): Set<string>;
