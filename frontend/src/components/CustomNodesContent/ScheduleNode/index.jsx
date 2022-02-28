import { faClock } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Grid, Tooltip, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { useEffect, useState } from 'react';
import { Handle } from 'react-flow-renderer';
import { useGlobalFlowState } from '../../../pages/Flow';
import { useGlobalRunState } from '../../../pages/View/useWebSocket';
import customNodeStyle from '../../../utils/customNodeStyle';
import ScheduleTriggerNodeItem from '../../MoreInfoContent/ScheduleTriggerNodeItem';
import MoreInfoMenu from '../../MoreInfoMenu';
import { getColor } from '../utils';

const ScheduleNode = (props) => {
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
        setBorderColor(getColor(RunState[props.id]?.status?.get()));

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [RunState[props.id].status?.get()]);

    return (
        <Tooltip title={'Node ID: ' + props.id} placement="top">
            <Box sx={{ ...customNodeStyle, border: `3px solid ${borderColor}` }}>
                <Handle type="source" position="right" id="schedule" style={{ backgroundColor: 'red', height: 10, width: 10 }} />
                <Grid container alignItems="flex-start" wrap="nowrap">
                    <Box component={FontAwesomeIcon} fontSize={19} color="secondary.main" icon={faClock} />
                    <Grid item ml={1.5} textAlign="left">
                        <Typography fontSize={11} fontWeight={900}>
                            Schedule trigger
                        </Typography>

                        <Typography fontSize={10} mt={1}>
                            Every 5 minutes
                        </Typography>
                    </Grid>
                </Grid>

                {isEditorPage && (
                    <Grid position="absolute" bottom={2} right={9} container wrap="nowrap" width="auto" alignItems="center" justifyContent="space-between">
                        <Box mt={2}>
                            <MoreInfoMenu iconHorizontal iconColor="#0073C6" iconColorDark="#0073C6" iconSize={19} noPadding>
                                <ScheduleTriggerNodeItem />
                            </MoreInfoMenu>
                        </Box>
                    </Grid>
                )}
            </Box>
        </Tooltip>
    );
};

export default ScheduleNode;
