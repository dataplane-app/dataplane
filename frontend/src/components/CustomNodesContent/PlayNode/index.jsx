import { faPlayCircle } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Grid, Tooltip, Typography, useTheme } from '@mui/material';
import { useEffect, useState } from 'react';
import { Handle, useUpdateNodeInternals } from 'react-flow-renderer';
import { useGlobalFlowState } from '../../../pages/Flow';
import { useGlobalRunState } from '../../../pages/View/useWebSocket';
import customNodeStyle from '../../../utils/customNodeStyle';
import { customSourceConnected, customSourceHandle, customSourceHandleDragging } from '../../../utils/handleStyles';
import PlayTriggerNodeItem from '../../MoreInfoContent/PlayTriggerNodeItem';
import MoreInfoMenu from '../../MoreInfoMenu';
import { getColor } from '../utils';

const PlayNode = (props) => {
    // Theme hook
    const theme = useTheme();

    // Update node hook
    // (This will fix the line not having the right size when the node connects to other nodes)
    const updateNodeInternals = useUpdateNodeInternals();

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
        setBorderColor(getColor(RunState[props.id]?.get()));

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [RunState[props.id].get()]);

    return (
        <Tooltip title={'Node ID: ' + props.id} placement="top">
            <Box sx={{ ...customNodeStyle, border: `3px solid ${borderColor}` }}>
                <Handle type="source" position="right" id="play" style={{ backgroundColor: 'red', height: 10, width: 10 }} />
                <Grid container alignItems="flex-start" wrap="nowrap">
                    <Box component={FontAwesomeIcon} fontSize={19} color="secondary.main" icon={faPlayCircle} />
                    <Grid item ml={1.5} textAlign="left">
                        <Typography fontSize={11} fontWeight={900}>
                            Play trigger
                        </Typography>

                        <Typography fontSize={10} mt={1}>
                            Press play to run
                        </Typography>
                    </Grid>

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
        </Tooltip>
    );
};

export default PlayNode;
