import type TokenProcessor from '../frontend/node_modules/sucrase/dist/types/TokenProcessor';
import type { DeclarationInfo } from '../frontend/node_modules/sucrase/dist/types/util/getDeclarationInfo';
/**
 * Common method sharing code between CJS and ESM cases, since they're the same here.
 */
export default function shouldElideDefaultExport(isTypeScriptTransformEnabled: boolean, keepUnusedImports: boolean, tokens: TokenProcessor, declarationInfo: DeclarationInfo): boolean;
