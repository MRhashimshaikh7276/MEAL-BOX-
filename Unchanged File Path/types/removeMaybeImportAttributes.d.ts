import type TokenProcessor from '../frontend/node_modules/sucrase/dist/types/TokenProcessor';
/**
 * Starting at a potential `with` or (legacy) `assert` token, remove the import
 * attributes if they exist.
 */
export declare function removeMaybeImportAttributes(tokens: TokenProcessor): void;
