import { faRobot } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Grid, Tooltip, Typography, useTheme } from '@mui/material';
import { Box } from '@mui/system';
import { useEffect, useState } from 'react';
import { Handle, Position } from 'react-flow-renderer';
import { useGlobalRunState } from '../../../../PipelineRuns/GlobalRunState.jsx';
import { customSourceHandle, customSourceHandleDragging, customTargetHandle } from '../../../../../utils/handleStyles.js';
import MoreInfoMenu from '../../MoreInfoMenu/index.jsx';
import { getColor } from '../utils/index.js';
import { displayRunTime } from '../../../../../utils/formatDate.js';
import { useGlobalPipelineRun } from '../../../../PipelineRuns/GlobalPipelineRunUIState.jsx';
import { useLocation } from 'react-router-dom';
import RpaEditorModeItem from '../../configureNodes/RpaEditorModeItem/index.jsx';
import RpaNodeItem from '../../configureNodes/RpaNodeItem/index.jsx';

const RpaNode = (props) => {
    // Theme hook
    const theme = useTheme();

    // Global state
    const FlowState = useGlobalPipelineRun();
    const RunState = useGlobalRunState();

    const [isEditorPage, setIsEditorPage] = useState(false);
    const [, setIsSelected] = useState(false);
    const [borderColor, setBorderColor] = useState('#c4c4c4');

    // Determine if editor page
    const { pathname } = useLocation();
    useEffect(() => {
        if (pathname.includes('/pipelines/flow/')) {
            setIsEditorPage(true);
        }
    }, [pathname]);

    useEffect(() => {
        setIsSelected(FlowState.selectedElement.get()?.id === props.id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setIsSelected(FlowState.selectedElement.get()?.id === props.id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [FlowState.selectedElement.get()]);

    // Set border color on node status change
    let nodeStatus = RunState.runObject?.nodes?.get() && RunState.runObject?.nodes[props.id]?.status?.get();

    useEffect(() => {
        // console.log("node status:", nodeStatus)
        if (nodeStatus) {
            setBorderColor(getColor(nodeStatus));
        } else {
            setBorderColor(getColor());
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nodeStatus]);

    const onClick = () => {
        RunState.node_id.set(props.id);
    };

    return (
        <Box sx={{ padding: '10px 15px', width: 150, height: 110, borderRadius: '10px', border: `3px solid ${borderColor}` }} onClick={onClick}>
            <Handle type="target" position={Position.Left} isConnectable id="clear" className="handlePulseAnimation" style={customTargetHandle(theme.palette.mode)} />
            <Handle type="source" position={Position.Right} id="3" style={FlowState.isDragging.get() ? customSourceHandleDragging : customSourceHandle(theme.palette.mode)} />
            <Tooltip
                title={
                    <>
                        <span style={{ userSelect: 'none' }}>Node ID:</span>
                        {props.id}
                    </>
                }
                placement="top">
                <Grid container alignItems="flex-start" wrap="nowrap" pb={2}>
                    <Box component={FontAwesomeIcon} fontSize={19} color="secondary.main" icon={faRobot} />
                    <Grid item ml={1.5} textAlign="left">
                        <Typography fontSize={11} fontWeight={900}>
                            {props.data.name}
                        </Typography>

                        <Tooltip title={props.data.description}>
                            <Typography fontSize={9} mt={0.4} height="54px" width="80px" overflow="hidden">
                                {props.data.description}
                            </Typography>
                        </Tooltip>
                    </Grid>
                </Grid>
            </Tooltip>

            <Grid position="absolute" bottom={2} left={9} right={9} container wrap="nowrap" width="auto" alignItems="center" justifyContent="space-between">
                <Grid item>
                    <Typography fontSize={8}>{props.data.language}</Typography>
                </Grid>

                <Grid item>
                    <Typography fontSize={8}>
                        {RunState.runObject?.nodes?.get() &&
                            RunState.runObject?.nodes[props.id]?.status?.get() === 'Success' &&
                            displayRunTime(RunState.runObject?.nodes[props.id]?.end_dt.get(), RunState.runObject?.nodes[props.id]?.start_dt.get())}
                    </Typography>
                </Grid>

                <Box mt={0}>
                    <MoreInfoMenu iconHorizontal iconColor="#0073C6" iconColorDark="#0073C6" iconSize={19} noPadding>
                        {isEditorPage ? <RpaEditorModeItem /> : <RpaNodeItem nodeId={props.id} nodeName={props.data.name} NodeTypeDesc={'rpa-python'} />}
                    </MoreInfoMenu>
                </Box>
            </Grid>
        </Box>
    );
};

export default RpaNode;
