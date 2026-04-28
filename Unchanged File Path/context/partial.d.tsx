import Matcher from '../frontend/node_modules/fast-glob/out/providers/matchers/matcher';
export default class PartialMatcher extends Matcher {
    match(filepath: string): boolean;
}
