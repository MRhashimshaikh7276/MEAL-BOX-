import type { Token } from '../frontend/node_modules/sucrase/dist/types/parser/tokenizer';
export default class NameManager {
    private readonly usedNames;
    constructor(code: string, tokens: Array<Token>);
    claimFreeName(name: string): string;
    findFreeName(name: string): string;
}
