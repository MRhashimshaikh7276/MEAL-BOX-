import type NameManager from '../frontend/node_modules/sucrase/dist/types/NameManager';
import type TokenProcessor from '../frontend/node_modules/sucrase/dist/types/TokenProcessor';
import Transformer from '../frontend/node_modules/sucrase/dist/types/transformers/Transformer';
export default class OptionalCatchBindingTransformer extends Transformer {
    readonly tokens: TokenProcessor;
    readonly nameManager: NameManager;
    constructor(tokens: TokenProcessor, nameManager: NameManager);
    process(): boolean;
}
