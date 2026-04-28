import { ChartCoordinate, Coordinate } from '../frontend/node_modules/recharts/types/util/types';
export type RadialCursorPoints = {
    points: [startPoint: Coordinate, endPoint: Coordinate];
    cx?: number;
    cy?: number;
    radius?: number;
    startAngle?: number;
    endAngle?: number;
};
/**
 * Only applicable for radial layouts
 * @param {Object} activeCoordinate ChartCoordinate
 * @returns {Object} RadialCursorPoints
 */
export declare function getRadialCursorPoints(activeCoordinate: ChartCoordinate): RadialCursorPoints;
