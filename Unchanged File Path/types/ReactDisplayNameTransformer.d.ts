import type CJSImportProcessor from '../frontend/node_modules/sucrase/dist/types/CJSImportProcessor';
import type { Options } from '../frontend/node_modules/sucrase/dist/types/index';
import type TokenProcessor from '../frontend/node_modules/sucrase/dist/types/TokenProcessor';
import type RootTransformer from '../frontend/node_modules/sucrase/dist/types/transformers/RootTransformer';
import Transformer from '../frontend/node_modules/sucrase/dist/types/transformers/Transformer';
/**
 * Implementation of babel-plugin-transform-react-display-name, which adds a
 * display name to usages of React.createClass and createReactClass.
 */
export default class ReactDisplayNameTransformer extends Transformer {
    readonly rootTransformer: RootTransformer;
    readonly tokens: TokenProcessor;
    readonly importProcessor: CJSImportProcessor | null;
    readonly options: Options;
    constructor(rootTransformer: RootTransformer, tokens: TokenProcessor, importProcessor: CJSImportProcessor | null, options: Options);
    process(): boolean;
    /**
     * This is called with the token position at the open-paren.
     */
    private tryProcessCreateClassCall;
    private findDisplayName;
    private getDisplayNameFromFilename;
    /**
     * We only want to add a display name when this is a function call containing
     * one argument, which is an object literal without `displayName` as an
     * existing key.
     */
    private classNeedsDisplayName;
}
