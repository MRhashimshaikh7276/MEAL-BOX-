import Settings from '../frontend/node_modules/fast-glob/out/settings';
import { ErrorFilterFunction } from '../frontend/node_modules/fast-glob/out/types';
export default class ErrorFilter {
    private readonly _settings;
    constructor(_settings: Settings);
    getFilter(): ErrorFilterFunction;
    private _isNonFatalError;
}
