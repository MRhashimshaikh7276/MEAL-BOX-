import { Task } from '../frontend/node_modules/fast-glob/out/managers/tasks';
import Settings from '../frontend/node_modules/fast-glob/out/settings';
import { MicromatchOptions, ReaderOptions } from '../frontend/node_modules/fast-glob/out/types';
import DeepFilter from '../frontend/node_modules/fast-glob/out/providers/filters/deep';
import EntryFilter from '../frontend/node_modules/fast-glob/out/providers/filters/entry';
import ErrorFilter from '../frontend/node_modules/fast-glob/out/providers/filters/error';
import EntryTransformer from '../frontend/node_modules/fast-glob/out/providers/transformers/entry';
export default abstract class Provider<T> {
    protected readonly _settings: Settings;
    readonly errorFilter: ErrorFilter;
    readonly entryFilter: EntryFilter;
    readonly deepFilter: DeepFilter;
    readonly entryTransformer: EntryTransformer;
    constructor(_settings: Settings);
    abstract read(_task: Task): T;
    protected _getRootDirectory(task: Task): string;
    protected _getReaderOptions(task: Task): ReaderOptions;
    protected _getMicromatchOptions(): MicromatchOptions;
}
