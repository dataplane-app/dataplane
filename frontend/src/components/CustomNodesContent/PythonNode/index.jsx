import { faRunning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Grid, Tooltip, Typography, useTheme } from '@mui/material';
import { Box } from '@mui/system';
import { useEffect, useState } from 'react';
import { Handle, Position } from 'react-flow-renderer';
import { useGlobalFlowState } from '../../../pages/Flow';
import { useGlobalRunState } from '../../../pages/View/GlobalRunState';
import { customSourceHandle, customSourceHandleDragging, customTargetHandle } from '../../../utils/handleStyles';
import ProcessTypeEditorModeItem from '../../MoreInfoContent/ProcessTypeEditorModeItem';
import ProcessTypeNodeItem from '../../MoreInfoContent/ProcessTypeNodeItem';
import MoreInfoMenu from '../../MoreInfoMenu';
import { getColor } from '../utils';

const PythonNode = (props) => {
    // Theme hook
    const theme = useTheme();

    // Global state
    const FlowState = useGlobalFlowState();
    const RunState = useGlobalRunState();

    const [isEditorPage, setIsEditorPage] = useState(false);
    const [, setIsSelected] = useState(false);
    const [borderColor, setBorderColor] = useState('#c4c4c4');

    useEffect(() => {
        setIsEditorPage(FlowState.isEditorPage.get());
        setIsSelected(FlowState.selectedElement.get()?.id === props.id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setIsEditorPage(FlowState.isEditorPage.get());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [FlowState.isEditorPage.get()]);

    useEffect(() => {
        setIsSelected(FlowState.selectedElement.get()?.id === props.id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [FlowState.selectedElement.get()]);

    // Set border color on node status change
    useEffect(() => {
        setBorderColor(getColor(RunState.nodes[props.id]?.status?.get()));

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [RunState.nodes[props.id]?.status?.get()]);

    const onClick = () => {
        RunState.node_id.set(props.id);
        RunState.node_name.set(props.data.name);
        RunState.node_description.set(props.data.description);
        RunState.selectedNodeStatus.set(RunState.nodes[props.id].status.get());
    };

    return (
        <Box sx={{ padding: '10px 15px', width: 160, borderRadius: '10px', border: `3px solid ${borderColor}` }} onClick={onClick}>
            <Handle type="target" position={Position.Left} isConnectable id="clear" className="handlePulseAnimation" style={customTargetHandle(theme.palette.mode)} />
            <Handle type="source" position={Position.Right} id="3" style={FlowState.isDragging.get() ? customSourceHandleDragging : customSourceHandle(theme.palette.mode)} />
            <Tooltip title={'Node ID: ' + props.id} placement="top">
                <Grid container alignItems="flex-start" wrap="nowrap" pb={2}>
                    <Box component={FontAwesomeIcon} fontSize={19} color="secondary.main" icon={faRunning} />
                    <Grid item ml={1.5} textAlign="left">
                        <Typography fontSize={11} fontWeight={900}>
                            {props.data.name}
                        </Typography>

                        <Typography fontSize={9} mt={0.4}>
                            {props.data.description}
                        </Typography>
                    </Grid>
                </Grid>
            </Tooltip>

            <Grid position="absolute" bottom={2} left={9} right={9} container wrap="nowrap" width="auto" alignItems="center" justifyContent="space-between">
                <Grid item>
                    <Typography fontSize={8}>{props.data.language}</Typography>
                </Grid>

                <Grid item>
                    <Typography fontSize={8}>
                        {RunState[props.id].status?.get() === 'Success' && displayTimer(RunState[props.id].end_dt?.get(), RunState[props.id].start_dt?.get())}
                    </Typography>
                </Grid>

                <Box mt={0}>
                    <MoreInfoMenu iconHorizontal iconColor="#0073C6" iconColorDark="#0073C6" iconSize={19} noPadding>
                        {isEditorPage ? <ProcessTypeEditorModeItem /> : <ProcessTypeNodeItem nodeId={props.id} nodeName={props.data.name} NodeTypeDesc={'python'} />}
                    </MoreInfoMenu>
                </Box>
            </Grid>
        </Box>
    );
};

export default PythonNode;

// Utility function
function displayTimer(end, start) {
    if (!end || !start) return null;
    var ticks = Math.floor((new Date(end) - new Date(start)) / 1000);
    var hh = Math.floor(ticks / 3600);
    var mm = Math.floor((ticks % 3600) / 60);
    var ss = ticks % 60;
    var ms = (new Date(end) - new Date(start)) % 1000;

    return pad(hh, 2) + ':' + pad(mm, 2) + ':' + pad(ss, 2) + '.' + pad(ms, 3);
}

function pad(n, width) {
    const num = n + '';
    return num.length >= width ? num : new Array(width - num.length + 1).join('0') + n;
}
