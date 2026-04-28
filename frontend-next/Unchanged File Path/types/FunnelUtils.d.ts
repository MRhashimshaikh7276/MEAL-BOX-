import React, { SVGProps } from 'react';
import { FunnelProps, FunnelTrapezoidItem } from '../frontend/node_modules/recharts/types/numberAxis/Funnel';
import { Props as TrapezoidProps } from '../frontend/node_modules/recharts/types/shape/Trapezoid';
export declare function typeGuardTrapezoidProps(option: SVGProps<SVGPathElement>, props: FunnelTrapezoidItem): TrapezoidProps;
type FunnelTrapezoidProps = {
    option: FunnelProps['activeShape'];
} & FunnelTrapezoidItem;
export declare function FunnelTrapezoid(props: FunnelTrapezoidProps): React.JSX.Element;
export {};
