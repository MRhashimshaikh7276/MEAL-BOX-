import type { Token } from '../frontend/node_modules/sucrase/dist/types/parser/tokenizer';
/**
 * Get all identifier names in the code, in order, including duplicates.
 */
export default function getIdentifierNames(code: string, tokens: Array<Token>): Array<string>;
