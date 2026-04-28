import { CartesianTickItem } from '../frontend/node_modules/recharts/types/util/types';
import { Sign } from '../frontend/node_modules/recharts/types/cartesian/getTicks';
export declare function getEquidistantTicks(sign: Sign, boundaries: {
    start: number;
    end: number;
}, getTickSize: (tick: CartesianTickItem, index: number) => number, ticks: CartesianTickItem[], minTickGap: number): CartesianTickItem[];
