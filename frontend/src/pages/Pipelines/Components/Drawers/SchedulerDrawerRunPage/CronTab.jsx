import { Timezone } from './Timezone.jsx';
import { Box, Link, Paper, Table, TableBody, TableCell, TableContainer, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import cronstrue from 'cronstrue';
import later from '@breejs/later';
import { isValidCron } from 'cron-validator';
import { useGlobalMeState } from '../../../../../components/Navbar/index.jsx';
import { DateTime } from 'luxon';

export function CronTab({ setValidationError, scheduleStatement, setScheduleStatement, timezone, setTimezone }) {
    // Local State
    const [schedule, setSchedule] = useState([]);

    const MeData = useGlobalMeState();
    const userTimezone = MeData.timezone.get();

    // Set schedule for upcoming runs on cron expression change
    useEffect(() => {
        // Prepare schedule table
        const sched = later.parse.cron(scheduleStatement);
        setSchedule(later.schedule(sched).next(20));

        // Validation check on save
        isValidCron(scheduleStatement) ? setValidationError(false) : setValidationError(true);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scheduleStatement]);

    const cronString = isValidCron(scheduleStatement) ? cronstrue.toString(scheduleStatement, { throwExceptionOnParseError: false }) : '';

    return (
        <Box display="flex" gap={8}>
            {/* Left Side */}
            <Box mt={1} sx={{ width: 650 }}>
                <Box display="flex" gap={4}>
                    <TextField size="small" value={scheduleStatement} label="CRON" id="schedule" fullWidth required onChange={(e) => setScheduleStatement(e.target.value)} />
                    <Timezone timezone={timezone} setTimezone={setTimezone} />
                </Box>

                <Typography fontSize={13} mt={1.5}>
                    {cronString.replace(/AM|PM/, (x) => x + ' ' + timezone)}
                </Typography>

                {/* <Typography fontSize={13} mt={1.5}>
                    {cronZone(cronString, schedule[0], timezone)}
                </Typography> */}

                <Typography fontSize={15} fontWeight={700} mt={3}>
                    Expected next 20 occurrences
                </Typography>

                {/* Table */}
                {isValidCron(scheduleStatement) ? (
                    <TableContainer
                        component={Paper}
                        sx={{
                            mt: 3,
                            width: 650,
                        }}>
                        <Table
                            sx={{
                                minWidth: 650,
                            }}
                            aria-label="simple table">
                            <TableBody>
                                {schedule.map((row, idx) => {
                                    return (
                                        <TableRow
                                            key={idx}
                                            sx={{
                                                '&:last-child td, &:last-child th': {
                                                    border: 0,
                                                },
                                            }}>
                                            <TableCell component="th" scope="row">
                                                {idx + 1}
                                            </TableCell>

                                            <TableCell component="th" scope="row">
                                                {DateTime.fromJSDate(row, { zone: timezone }).toFormat('EEE')},
                                            </TableCell>

                                            <TableCell component="th" scope="row">
                                                {DateTime.fromJSDate(row, { zone: timezone }).toFormat('d')}
                                            </TableCell>

                                            <TableCell component="th" scope="row">
                                                {DateTime.fromJSDate(row, { zone: timezone }).toFormat('MMM')}
                                            </TableCell>

                                            <TableCell component="th" scope="row">
                                                {DateTime.fromJSDate(row, { zone: timezone }).toFormat('yyyy')}
                                            </TableCell>

                                            {userTimezone ? (
                                            
                                                    <TableCell component="th" scope="row">
                                                        {DateTime.fromJSDate(row, { zone: "UTC" }).toFormat('HH:mm:ss')}
                                                    </TableCell>
                                               
                                            ) : null}

                                            {userTimezone ? (
                                            
                                                    <TableCell component="th" scope="row">
                                                        {DateTime.fromJSDate(row, { zone: timezone }).toFormat('z (ZZZZ)')}
                                                    </TableCell>
                                               
                                            ) : null}
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : null}
            </Box>

            {/* Right Side */}
            <Box mt={1}>
                <Typography fontSize={15} fontWeight={700}>
                    Examples
                </Typography>
                <Typography fontSize={13} mt={0.5}>
                    See more at{' '}
                    <Link href="https://crontab.guru/" fontSize={13} underline="none" target="_blank" rel="noreferrer">
                        https://crontab.guru/
                    </Link>
                </Typography>
                <Typography sx={{ cursor: 'pointer' }} mt={1} fontSize={13}></Typography>
                <Typography sx={{ cursor: 'pointer' }} mt={1} color="primary.main" fontSize={13} onClick={() => setScheduleStatement('* * * * *')}>
                    Every minute
                </Typography>
                <Typography sx={{ cursor: 'pointer' }} mt={0.5} color="primary.main" fontSize={13} onClick={() => setScheduleStatement('*/30 * * * *')}>
                    Every 30 minutes
                </Typography>
                <Typography sx={{ cursor: 'pointer' }} mt={0.5} color="primary.main" fontSize={13} onClick={() => setScheduleStatement('0 * * * *')}>
                    Every hour
                </Typography>
                <Typography sx={{ cursor: 'pointer' }} mt={0.5} color="primary.main" fontSize={13} onClick={() => setScheduleStatement('0 */6 * * *')}>
                    Every 6 hours
                </Typography>
                <Typography sx={{ cursor: 'pointer' }} mt={0.5} color="primary.main" fontSize={13} onClick={() => setScheduleStatement('0 8 * * *')}>
                    Every day at 8am ({timezone})
                </Typography>
                <Typography sx={{ cursor: 'pointer' }} mt={0.5} color="primary.main" fontSize={13} onClick={() => setScheduleStatement('0 11 * * 5')}>
                    Every Friday at 11am ({timezone})
                </Typography>
                <Typography sx={{ cursor: 'pointer' }} mt={0.5} color="primary.main" fontSize={13} onClick={() => setScheduleStatement('0 22 * * 1-5')}>
                    At 10pm, Monday through Friday ({timezone})
                </Typography>
                <Typography sx={{ cursor: 'pointer' }} mt={0.5} color="primary.main" fontSize={13} onClick={() => setScheduleStatement('0 14 5 * *')}>
                    Every month on day 5 at 2pm ({timezone})
                </Typography>
            </Box>
        </Box>
    );
}

// Utility functions
// function cronZone(statement, next, zone) {
//     // Return if there is no time
//     if (/\d\d:\d\d (AM|PM)/.test(statement) === false) return;

//     const time = DateTime.fromJSDate(next, { zone }).toFormat('hh:mm a z');
//     statement = statement.replace(/\d\d:\d\d (AM|PM)/, time);
//     return statement;
// }
