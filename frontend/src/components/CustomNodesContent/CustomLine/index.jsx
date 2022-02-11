import { useTheme } from '@emotion/react';
import React from 'react';

const CustomLine = ({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, connectionLineType, connectionLineStyle }) => {
    const theme = useTheme();

    return (
        <g>
            <path
                fill="none"
                stroke={theme.palette.mode === 'dark' ? '#fff' : '#222'}
                strokeWidth={3}
                d={`M${sourceX},${sourceY} C ${sourceX} ${targetY} ${sourceX} ${targetY} ${targetX},${targetY}`}
                markerEnd="url(#react-flow__arrowclosed)"
            />
        </g>
    );
};

export default CustomLine;
