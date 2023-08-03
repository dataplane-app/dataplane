import React from 'react';
import { useTheme } from '@emotion/react';
import { getBezierPath, getEdgeCenter, getMarkerEnd } from 'react-flow-renderer';
import { useGlobalFlowState } from '../../../../pages/PipelineEdit';

import './style.css';

const foreignObjectSize = 40;

const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, data, arrowHeadType, markerEndId }) => {
    const theme = useTheme();
    const Flow = useGlobalFlowState();

    const onEdgeClick = (evt, id) => {
        Flow.selectedEdge.set(id);
        evt.stopPropagation();
    };
    const edgePath = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
    const markerEnd = getMarkerEnd(arrowHeadType, markerEndId);

    const [edgeCenterX, edgeCenterY] = getEdgeCenter({
        sourceX,
        sourceY,
        targetX,
        targetY,
    });

    return (
        <>
            <path fill="none" stroke={theme.palette.mode === 'dark' ? '#fff' : '#222'} strokeWidth={3} id={id} style={style} d={edgePath} markerEnd={markerEnd} />
            {Flow.isEditorPage.get() ? (
                <foreignObject
                    width={foreignObjectSize}
                    height={foreignObjectSize}
                    x={edgeCenterX - foreignObjectSize / 2}
                    y={edgeCenterY - foreignObjectSize / 2}
                    className="edgebutton-foreignobject"
                    requiredExtensions="http://www.w3.org/1999/xhtml">
                    <div className="parent_edgebutton">
                        <button className="edgebutton" onClick={(event) => onEdgeClick(event, id)}>
                            ×
                        </button>
                    </div>
                </foreignObject>
            ) : null}
        </>
    );
};

export default CustomEdge;
