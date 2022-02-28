import { useTheme } from '@emotion/react';
import React from 'react';
import { getBezierPath } from 'react-flow-renderer';
import { useGlobalFlowState } from '../../../pages/Flow';

const CustomLine = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, data, arrowHeadType, markerEndId }) => {
    const theme = useTheme();
    const edgePath = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
    const FlowState = useGlobalFlowState();

    return (
        <g>
            <path
                fill="none"
                className={`${FlowState.isDragging.get() ? 'animated' : 'react-flow__edge-path'}`}
                stroke={theme.palette.mode === 'dark' ? '#fff' : '#222'}
                strokeWidth={3}
                d={edgePath}
                markerEnd="url(#react-flow__arrowclosed)"
            />
        </g>
    );
};

export default CustomLine;
