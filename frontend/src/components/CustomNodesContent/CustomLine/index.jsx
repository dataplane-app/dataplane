import { useTheme } from '@emotion/react';
import React from 'react';
import { getBezierPath } from 'react-flow-renderer';

const CustomLine = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, data, arrowHeadType, markerEndId }) => {
    const theme = useTheme();
    const edgePath = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });

    return (
        <g>
            <path fill="none" stroke={theme.palette.mode === 'dark' ? '#fff' : '#222'} strokeWidth={3} d={edgePath} markerEnd="url(#react-flow__arrowclosed)" />
        </g>
    );
};

export default CustomLine;
