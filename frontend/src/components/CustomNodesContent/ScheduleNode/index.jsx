import { faClock } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Grid, Tooltip, Typography, useTheme } from '@mui/material';
import { Box } from '@mui/system';
import { useEffect, useState } from 'react';
import { Handle } from 'react-flow-renderer';
import { useGlobalFlowState } from '../../../pages/PipelineEdit';
import customNodeStyle from '../../../utils/customNodeStyle';
import { customSourceHandle, customSourceHandleDragging } from '../../../utils/handleStyles';
import ScheduleTriggerNodeItem from '../../MoreInfoContent/ScheduleTriggerNodeItem';
import MoreInfoMenu from '../../MoreInfoMenu';
import { getColor } from '../utils';
import { useGlobalRunState } from '../../../pages/PipelineRuns/GlobalRunState';
import cronZone from '../../../utils/cronZone';
import { getTimeZone } from '../../../utils/formatDate';
import { useParams } from 'react-router-dom';

const ScheduleNode = (props) => {
    // Theme hook
    const theme = useTheme();

    // Global state
    const FlowState = useGlobalFlowState();
    const RunState = useGlobalRunState();

    const [isEditorPage, setIsEditorPage] = useState(false);
    const [, setIsSelected] = useState(false);
    const [borderColor, setBorderColor] = useState('#c4c4c4');
    const [schedule, setSchedule] = useState(null);

    const { pipelineId } = useParams();

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

    // Set description
    useEffect(() => {
        setSchedule(cronZone(props.data.genericdata.schedule, props.data.genericdata.timezone, props.data.genericdata.scheduleType));
    }, [props.data.genericdata.schedule, props.data.genericdata.scheduleType, props.data.genericdata.timezone]);

    return (
        <Box sx={{ ...customNodeStyle, border: `3px solid ${borderColor}` }}>
            <Handle type="source" position="right" id="schedule" style={FlowState.isDragging.get() ? customSourceHandleDragging : customSourceHandle(theme.palette.mode)} />
            <Grid container alignItems="flex-start" wrap="nowrap">
                <Box component={FontAwesomeIcon} fontSize={19} color="secondary.main" icon={faClock} />
                <Tooltip title={'Node ID: ' + props.id} placement="top">
                    <Grid item ml={1.5} textAlign="left">
                        <Typography fontSize={11} fontWeight={900}>
                            Schedule trigger
                        </Typography>

                        <Typography fontSize={10} mt={1}>
                            {schedule}
                        </Typography>

                        <Typography fontSize={10} mt={1}>
                            {getTimeZone(props.data.genericdata.timezone)}
                        </Typography>
                    </Grid>
                </Tooltip>
            </Grid>

            {pipelineId ? (
                <Grid position="absolute" bottom={2} right={9} container wrap="nowrap" width="auto" alignItems="center" justifyContent="space-between">
                    <Box mt={2}>
                        <MoreInfoMenu iconHorizontal iconColor="#0073C6" iconColorDark="#0073C6" iconSize={19} noPadding>
                            <ScheduleTriggerNodeItem />
                        </MoreInfoMenu>
                    </Box>
                </Grid>
            ) : null}
        </Box>
    );
};

export default ScheduleNode;
