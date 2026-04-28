import type TokenProcessor from '../frontend/node_modules/sucrase/dist/types/TokenProcessor';
import Transformer from '../frontend/node_modules/sucrase/dist/types/transformers/Transformer';
export default class ReactHotLoaderTransformer extends Transformer {
    readonly tokens: TokenProcessor;
    readonly filePath: string;
    private extractedDefaultExportName;
    constructor(tokens: TokenProcessor, filePath: string);
    setExtractedDefaultExportName(extractedDefaultExportName: string): void;
    getPrefixCode(): string;
    getSuffixCode(): string;
    process(): boolean;
}
