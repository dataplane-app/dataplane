import { faClock } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Grid, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { useEffect, useState } from 'react';
import { Handle } from 'react-flow-renderer';
import { useGlobalFlowState } from '../../../pages/Flow';
import customNodeStyle from '../../../utils/customNodeStyle';
import ScheduleTriggerNodeItem from '../../MoreInfoContent/ScheduleTriggerNodeItem';
import MoreInfoMenu from '../../MoreInfoMenu';

const ScheduleNode = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [isEditorPage, setIsEditorPage] = useState(false);
    const [isSelected, setIsSelected] = useState(false);

    const FlowState = useGlobalFlowState();

    useEffect(() => {
        setIsRunning(FlowState.isRunning.get());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [FlowState.isRunning.get()]);

    useEffect(() => {
        setIsEditorPage(FlowState.isEditorPage.get());
        setIsSelected(FlowState.selectedElementId.get() === 'djdsfjdf3');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setIsEditorPage(FlowState.isEditorPage.get());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [FlowState.isEditorPage.get()]);

    useEffect(() => {
        setIsSelected(FlowState.selectedElementId.get() === 'djdsfjdf3');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [FlowState.selectedElementId.get()]);

    return (
        <Box sx={{ ...customNodeStyle, border: isSelected ? '3px solid #FF5722' : isRunning ? '3px solid #76A853' : '3px solid #c4c4c4' }}>
            <Handle type="source" position="right" id="schedule" style={{ backgroundColor: 'red', right: -0.7 }} />
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
    );
};

export default ScheduleNode;
