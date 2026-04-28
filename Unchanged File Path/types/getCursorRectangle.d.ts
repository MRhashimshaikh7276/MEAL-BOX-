import { ChartCoordinate, ChartOffset, LayoutType } from '../frontend/node_modules/recharts/types/util/types';
export type CursorRectangle = {
    stroke: string;
    fill: string;
    x: number;
    y: number;
    width: number;
    height: number;
};
export declare function getCursorRectangle(layout: LayoutType, activeCoordinate: ChartCoordinate, offset: ChartOffset, tooltipAxisBandSize: number): CursorRectangle;
