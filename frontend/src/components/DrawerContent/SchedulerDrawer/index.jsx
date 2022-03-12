import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, Tab, Tabs, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useGlobalFlowState } from '../../../pages/Flow';
import { IOSSwitch } from './IOSSwitch';
import { CronTab } from './CronTab';
import { CronSecondsTab } from './CronSecondsTab';
import { useSnackbar } from 'notistack';

const ScheduleDrawer = ({ handleClose, setElements }) => {
    // Flow state
    const FlowState = useGlobalFlowState();

    const { enqueueSnackbar } = useSnackbar();

    const [isOnline, setIsOnline] = useState(true);
    const [validationError, setValidationError] = useState(false);

    // Tabs state
    const [tabValue, setTabValue] = useState(0);
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // Schedule state
    const [scheduleStatement, setScheduleStatement] = useState('');
    const [timezone, setTimezone] = useState(null);
    const [seconds, setSeconds] = useState(null);

    // Set triggerOnline switch on load
    useEffect(() => {
        setIsOnline(FlowState.selectedElement?.data?.triggerOnline.get());
        setTimezone(FlowState.selectedElement?.data?.genericdata?.timezone?.get());

        if (FlowState.selectedElement?.data?.genericdata?.scheduleType?.get() === 'cronseconds') {
            setTabValue(1);
            setSeconds(FlowState.selectedElement?.data?.genericdata?.schedule?.get() || '');
        } else {
            setScheduleStatement(FlowState.selectedElement?.data?.genericdata?.schedule?.get() || '');
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [FlowState.selectedElement?.data?.triggerOnline.get()]);

    // Update triggerOnline on submit
    async function onSubmit(e) {
        e.preventDefault();

        // Check if cron statement is valid on save
        if (validationError && !tabValue) {
            enqueueSnackbar('Invalid statement', { variant: 'error' });
            return;
        }

        setElements((els) =>
            els.map((el) => {
                if (el.id === FlowState.selectedElement.id.get()) {
                    el.data = {
                        ...el.data,
                        triggerOnline: isOnline,
                        genericdata: {
                            schedule: tabValue ? seconds : scheduleStatement,
                            scheduleType: tabValue ? 'cronseconds' : 'cron',
                            timezone: timezone,
                        },
                    };
                }
                return el;
            })
        );

        handleClose();
    }

    return (
        <form onSubmit={onSubmit}>
            <Box position="relative" width="100%">
                <Box sx={{ p: '4.125rem 3.81rem', paddingTop: '26px' }}>
                    {/* Upper Section */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        {/* Title and Online switch */}
                        <Box>
                            <Typography component="h2" variant="h2">
                                Trigger - Scheduler
                            </Typography>

                            <Box display="flex" alignItems="center" mt={3}>
                                <IOSSwitch onClick={() => setIsOnline(!isOnline)} checked={isOnline} inputProps={{ 'aria-label': 'controlled' }} />
                                <Typography fontSize={13} ml={1.5} color={isOnline ? ' #2E6707' : '#F80000'}>
                                    {isOnline ? 'Online' : 'Offline'}
                                </Typography>
                                <Typography fontSize={13} position="absolute" ml={14}>
                                    {isOnline ? 'Scheduler will go live on save.' : 'Scheduler will be off on save.'}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Save/Close buttons */}
                        <Box top="26px" right="39px" display="flex" alignItems="center">
                            <Button //
                                type="submit"
                                variant="contained"
                                color="primary"
                                style={{ paddingLeft: '26px', paddingRight: '26px', marginLeft: '20px' }}>
                                Save
                            </Button>
                            <Button
                                onClick={handleClose}
                                style={{ paddingLeft: '16px', paddingRight: '16px', marginLeft: '20px' }}
                                variant="text"
                                startIcon={<FontAwesomeIcon icon={faTimes} />}>
                                Close
                            </Button>

                            {/* RRule warning */}
                            {tabValue ? (
                                <Box position="absolute" width="450px" sx={{ background: 'rgba(123, 97, 255, 0.12)', right: '60px', top: '80px', p: 1, borderRadius: '6px' }}>
                                    <Typography color="purple.main" fontSize={13}>
                                        CRON is limited to per minute schedules.
                                    </Typography>

                                    <Typography color="purple.main" fontSize={13} mt={1}>
                                        Due to distributed locking leases, it is not advised to use schedules less then 3 seconds.
                                    </Typography>
                                </Box>
                            ) : null}
                        </Box>
                    </Box>

                    {/* Tab panels */}
                    <Box sx={{ width: '100%' }} mt={3}>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs value={tabValue} onChange={handleTabChange} aria-label="schedule tabs">
                                <Tab label="CRON" id="tab-0" aria-controls="tabpanel-0" sx={{ fontWeight: 700, fontSize: '1.0625rem', color: 'primary.main' }} />
                                <Tab label="Per second" id="tab-1" aria-controls="tabpanel-1" sx={{ fontWeight: 700, fontSize: '1.0625rem', color: 'primary.main' }} />
                            </Tabs>
                        </Box>
                        <TabPanel value={tabValue} index={0}>
                            <CronTab
                                setValidationError={setValidationError}
                                scheduleStatement={scheduleStatement}
                                setScheduleStatement={setScheduleStatement}
                                timezone={timezone}
                                setTimezone={setTimezone}
                            />
                        </TabPanel>
                        <TabPanel value={tabValue} index={1}>
                            <CronSecondsTab seconds={seconds} setSeconds={setSeconds} />
                        </TabPanel>
                    </Box>
                </Box>
            </Box>
        </form>
    );
};

export default ScheduleDrawer;

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`} aria-labelledby={`tab-${index}`} {...other}>
            {value === index && <Box sx={{ p: 3, paddingLeft: 0 }}>{children}</Box>}
        </div>
    );
}
