import type TokenProcessor from '../frontend/node_modules/sucrase/dist/types/TokenProcessor';
import Transformer from '../frontend/node_modules/sucrase/dist/types/transformers/Transformer';
export default class NumericSeparatorTransformer extends Transformer {
    readonly tokens: TokenProcessor;
    constructor(tokens: TokenProcessor);
    process(): boolean;
}
