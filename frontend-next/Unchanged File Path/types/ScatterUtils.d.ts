import * as React from 'react';
import { ActiveShape, SymbolType } from '../frontend/node_modules/recharts/types/util/types';
import { ScatterPointItem } from '../frontend/node_modules/recharts/types/cartesian/Scatter';
export declare function ScatterSymbol({ option, isActive, ...props }: {
    option: ActiveShape<ScatterPointItem> | SymbolType;
    isActive: boolean;
} & ScatterPointItem): React.JSX.Element;
