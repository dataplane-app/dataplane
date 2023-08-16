import { faPlayCircle } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Grid, Tooltip, Typography, useTheme } from '@mui/material';
import { useEffect, useState } from 'react';
import { Handle } from 'react-flow-renderer';
import { useGlobalFlowState } from '../../../PipelineEdit.jsx';
import { useGlobalRunState } from '../../../../PipelineRuns/GlobalRunState.jsx';
import customNodeStyle from '../../../../../utils/customNodeStyle.js';
import { customSourceHandle, customSourceHandleDragging } from '../../../../../utils/handleStyles.js';
import PlayTriggerNodeItem from '../../configureNodes/PlayTriggerNodeItem/index.jsx';
import MoreInfoMenu from '../../MoreInfoMenu/index.jsx';
import { getColor } from '../utils/index.js';

const PlayNode = (props) => {
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
            <Handle type="source" position="right" id="play" style={FlowState.isDragging.get() ? customSourceHandleDragging : customSourceHandle(theme.palette.mode)} />
            <Grid container alignItems="flex-start" wrap="nowrap">
                <Box component={FontAwesomeIcon} fontSize={19} color="secondary.main" icon={faPlayCircle} />
                <Tooltip title={'Node ID: ' + props.id} placement="top">
                    <Grid item ml={1.5} textAlign="left">
                        <Typography fontSize={11} fontWeight={900}>
                            Play trigger
                        </Typography>

                        <Typography fontSize={10} mt={1}>
                            Press play to run
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

export default PlayNode;
