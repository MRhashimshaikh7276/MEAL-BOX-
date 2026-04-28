import type TokenProcessor from '../frontend/node_modules/sucrase/dist/types/TokenProcessor';
/**
 * Starting at `export {`, look ahead and return `true` if this is an
 * `export {...} from` statement and `false` if this is a plain multi-export.
 */
export default function isExportFrom(tokens: TokenProcessor): boolean;
