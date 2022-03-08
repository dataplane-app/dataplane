import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Autocomplete, Box, Button, Grid, Paper, Switch, Table, TableBody, TableCell, TableContainer, TableRow, TextField, Typography } from '@mui/material';
import { styled } from '@mui/system';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { RRule } from 'rrule';
import { useTurnOnOffPipeline } from '../../../graphql/turnOnOffPipeline';
import { useGlobalFlowState } from '../../../pages/Flow';

const ScheduleDrawer = ({ handleClose, environmentID, pipelineID, setElements }) => {
    const rule = new RRule({
        freq: RRule.WEEKLY,
        count: 30,
        interval: 1,
    });

    console.log(rule.all());

    // Flow state
    const FlowState = useGlobalFlowState();

    const [type, setType] = useState();
    const { register, handleSubmit } = useForm();
    const [isOnline, setIsOnline] = useState(true);

    // Set triggerOnline switch on load
    useEffect(() => {
        setIsOnline(FlowState.selectedElement?.data?.triggerOnline.get());

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [FlowState.selectedElement?.data?.triggerOnline.get()]);

    // Update triggerOnline on submit
    async function onSubmit(data) {
        handleClose();
        setElements((els) =>
            els.map((el) => {
                if (el.id === FlowState.selectedElement.id.get()) {
                    el.data = {
                        ...el.data,
                        triggerOnline: isOnline,
                    };
                }
                return el;
            })
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Box position="relative" width="100%">
                <Box sx={{ p: '4.125rem 3.81rem' }}>
                    <Box position="absolute" top="26px" right="39px" display="flex" alignItems="center">
                        <Button onClick={handleClose} style={{ paddingLeft: '16px', paddingRight: '16px' }} variant="text" startIcon={<FontAwesomeIcon icon={faTimes} />}>
                            Close
                        </Button>
                    </Box>

                    <Box mt={3} width="212px">
                        <Typography component="h2" variant="h2">
                            Trigger - Scheduler
                        </Typography>

                        <Box mt={5}>
                            <Autocomplete
                                disablePortal
                                value={type}
                                id="combo-box-demo"
                                onChange={(event, newValue) => {
                                    setType(newValue);
                                }}
                                options={[]}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Schedule type"
                                        id="schecule_type"
                                        size="small"
                                        sx={{ mt: 2, fontSize: '.75rem', display: 'flex' }}
                                        {...register('type')}
                                    />
                                )}
                            />
                            <TextField
                                label="Schedule"
                                id="schedule"
                                size="small"
                                // required
                                sx={{ mb: 2, mt: 2, fontSize: '.75rem', display: 'flex' }}
                                {...register('schedule', { required: false })}
                            />

                            <Box display="flex" alignItems="center">
                                <IOSSwitch onClick={() => setIsOnline(!isOnline)} checked={isOnline} {...register('live')} inputProps={{ 'aria-label': 'controlled' }} />
                                <Typography fontSize={13} ml={1.5} color={isOnline ? ' #2E6707' : '#F80000'}>
                                    {isOnline ? 'Online' : 'Offline'}
                                </Typography>
                                <Typography fontSize={13} position="absolute" ml={14}>
                                    {isOnline ? 'Scheduler will go live on save.' : 'Scheduler will be off on save.'}
                                </Typography>
                            </Box>
                        </Box>

                        <Grid mt={4} display="flex" alignItems="center">
                            <Button type="submit" variant="contained" color="primary" style={{ width: '100%' }}>
                                Save
                            </Button>
                        </Grid>
                    </Box>

                    <Box mt={7}>
                        <Typography fontSize={15} fontWeight={700}>
                            Expected
                        </Typography>

                        <TableContainer component={Paper} sx={{ mt: 3 }}>
                            <Table sx={{ minWidth: 650 }} aria-label="simple table">
                                <TableBody>
                                    {rule.all().map((row, idx) => {
                                        // console.log(new Date(row).getFullYear());
                                        return (
                                            <TableRow key={idx} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                <TableCell component="th" scope="row">
                                                    {idx + 1}
                                                </TableCell>
                                                <TableCell component="th" scope="row">
                                                    {new Date(row).getDate()}
                                                </TableCell>
                                                <TableCell component="th" scope="row">
                                                    {new Date(row).getMonth()}
                                                </TableCell>
                                                <TableCell component="th" scope="row">
                                                    {new Date(row).getFullYear()}
                                                </TableCell>
                                                <TableCell component="th" scope="row">
                                                    {new Date(row).getTime()}
                                                </TableCell>
                                                <TableCell component="th" scope="row">
                                                    {new Date(row).getFullYear()}
                                                </TableCell>
                                                <TableCell component="th" scope="row">
                                                    {new Date(row).getFullYear()}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </Box>
            </Box>
        </form>
    );
};

export default ScheduleDrawer;

const IOSSwitch = styled(Switch)(({ theme }) => ({
    width: 42,
    height: 26,
    padding: 0,
    '& .MuiSwitch-switchBase': {
        padding: 0,
        margin: 2,
        transitionDuration: '300ms',
        '&.Mui-checked': {
            transform: 'translateX(16px)',
            color: '#fff',
            '& + .MuiSwitch-track': {
                backgroundColor: theme.palette.mode === 'dark' ? '#2ECA45' : '#72B842',
                opacity: 1,
                border: 0,
            },
            '&.Mui-disabled + .MuiSwitch-track': {
                opacity: 0.5,
            },
        },
        '&.Mui-focusVisible .MuiSwitch-thumb': {
            color: '#33cf4d',
            border: '6px solid #fff',
        },
        '&.Mui-disabled .MuiSwitch-thumb': {
            color: theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[600],
        },
        '&.Mui-disabled + .MuiSwitch-track': {
            opacity: theme.palette.mode === 'light' ? 0.7 : 0.3,
        },
    },
    '& .MuiSwitch-thumb': {
        boxSizing: 'border-box',
        width: 22,
        height: 22,
    },
    '& .MuiSwitch-track': {
        borderRadius: 26 / 2,
        backgroundColor: theme.palette.mode === 'light' ? '#F80000' : '#F80000',
        opacity: 1,
        transition: theme.transitions.create(['background-color'], {
            duration: 500,
        }),
    },
}));
