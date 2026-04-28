import type { Options } from '../frontend/node_modules/sucrase/dist/types/index';
export interface JSXPragmaInfo {
    base: string;
    suffix: string;
    fragmentBase: string;
    fragmentSuffix: string;
}
export default function getJSXPragmaInfo(options: Options): JSXPragmaInfo;
