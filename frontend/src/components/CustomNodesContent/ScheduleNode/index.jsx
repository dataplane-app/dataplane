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
import cronstrue from 'cronstrue';
import { useGlobalRunState } from '../../../pages/PipelineRuns/GlobalRunState';
import later from '@breejs/later';
import { DateTime } from 'luxon';

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
        if (props.data.genericdata.scheduleType === 'cron') {
            // Get next occurrence
            const next = later.schedule(later.parse.cron(props.data.genericdata.schedule)).next(1);
            setSchedule(cronZone(cronstrue.toString(props.data.genericdata.schedule, { throwExceptionOnParseError: false }), next, props.data.genericdata.timezone));
        } else {
            if (props.data.genericdata.schedule === '*/1 * * * * *') {
                setSchedule('Every second');
            } else {
                setSchedule('Every ' + props.data.genericdata.schedule.split(' ')[0].replace('*/', '') + ' seconds');
            }
        }
    }, [props.data.genericdata.schedule, props.data.genericdata.scheduleType, props.data.genericdata.timezone, schedule]);

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
                            {DateTime.fromJSDate(new Date(), { zone: props.data.genericdata.timezone }).toFormat('z (ZZZZ)')}
                        </Typography>
                    </Grid>
                </Tooltip>
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

// Utility function
function cronZone(statement, next, zone) {
    // Return if there is no time
    if (/\d\d:\d\d (AM|PM)/.test(statement) === false) return;

    const time = DateTime.fromJSDate(next, { zone }).toFormat('HH:mm a');
    statement = statement.replace(/\d\d:\d\d (AM|PM)/, time);
    return statement;
}
