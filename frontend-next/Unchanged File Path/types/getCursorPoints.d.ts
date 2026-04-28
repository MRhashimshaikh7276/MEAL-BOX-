import { ChartCoordinate, Coordinate, ChartOffset, LayoutType } from '../frontend/node_modules/recharts/types/util/types';
import { RadialCursorPoints } from '../frontend/node_modules/recharts/types/util/cursor/getRadialCursorPoints';
export declare function getCursorPoints(layout: LayoutType, activeCoordinate: ChartCoordinate, offset: ChartOffset): [Coordinate, Coordinate] | RadialCursorPoints;
