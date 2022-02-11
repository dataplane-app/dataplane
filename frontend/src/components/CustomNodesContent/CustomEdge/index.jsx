import React from 'react';
import { useTheme } from '@emotion/react';
import { getBezierPath, getMarkerEnd } from 'react-flow-renderer';

const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, data, arrowHeadType, markerEndId }) => {
    const theme = useTheme();

    const edgePath = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
    const markerEnd = getMarkerEnd(arrowHeadType, markerEndId);

    return (
        <>
            <path fill="none" stroke={theme.palette.mode === 'dark' ? '#fff' : '#222'} strokeWidth={3} id={id} style={style} d={edgePath} markerEnd={markerEnd} />
        </>
    );
};

export default CustomEdge;
