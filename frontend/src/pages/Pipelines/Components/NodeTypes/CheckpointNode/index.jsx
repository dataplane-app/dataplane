import { faMapMarkedAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Grid, Tooltip, Typography, useTheme, Box } from '@mui/material';
import { useEffect, useState } from 'react';
import { Handle, Position } from 'react-flow-renderer';
import { useGlobalFlowState } from '../../../PipelineEdit.jsx';
import { useGlobalRunState } from '../../../../PipelineRuns/GlobalRunState.jsx';
import customNodeStyle from '../../../../../utils/customNodeStyle.js';
import { customTargetHandle } from '../../../../../utils/handleStyles.js';
import PlayTriggerNodeItem from '../../configureNodes/PlayTriggerNodeItem/index.jsx';
import MoreInfoMenu from '../../MoreInfoMenu/index.jsx';
import { getColor } from '../utils/index.js';

const CheckpointNode = (props) => {
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
    let nodeStatus = RunState.runObject?.nodes?.get() && RunState.runObject?.nodes[props.id].status?.get();

    useEffect(() => {
        if (nodeStatus) {
            setBorderColor(getColor(nodeStatus));
        } else {
            setBorderColor(getColor());
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nodeStatus]);

    return (
        <Box sx={{ ...customNodeStyle, border: `3px solid ${borderColor}` }}>
            <Handle type="source" position={Position.Right} id="checkpoint_source" style={customTargetHandle(theme.palette.mode)} />
            <Handle type="target" position={Position.Left} id="checkpoint_target" className="handlePulseAnimation" style={customTargetHandle(theme.palette.mode)} />
            <Grid container alignItems="flex-start" wrap="nowrap">
                <Box component={FontAwesomeIcon} fontSize={19} color="secondary.main" icon={faMapMarkedAlt} />
                <Tooltip title={'Node ID: ' + props.id} placement="top">
                    <Grid item ml={1.5} textAlign="left">
                        <Typography fontSize={11} fontWeight={900}>
                            Checkpoint
                        </Typography>
                    </Grid>
                </Tooltip>

                {isEditorPage && (
                    <Grid position="absolute" bottom={2} right={9} container wrap="nowrap" width="auto" alignItems="center" justifyContent="space-between">
                        <Box mt={2}>
                            <MoreInfoMenu iconHorizontal iconColor="#0073C6" iconColorDark="#0073C6" iconSize={19} noPadding>
                                <PlayTriggerNodeItem />
                            </MoreInfoMenu>
                        </Box>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

export default CheckpointNode;
