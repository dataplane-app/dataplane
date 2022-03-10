import { Timezone } from './Timezone';
import { Box, Link, Paper, Table, TableBody, TableCell, TableContainer, TableRow, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import cronstrue from 'cronstrue';
import later from '@breejs/later';
import { isValidCron } from 'cron-validator';

export function Cron() {
    // Local State
    const [cronExpression, setCronExpression] = useState('');
    const [schedule, setSchedule] = useState([]);
    const [timezone, setTimezone] = useState('');

    // Set schedule for upcoming runs on cron expression change
    useEffect(() => {
        const sched = later.parse.cron(cronExpression);
        setSchedule(later.schedule(sched).next(20));
    }, [cronExpression]);

    return (
        <Box display="flex" gap={8}>
            {/* Left Side */}
            <Box mt={1} sx={{ width: 650 }}>
                <Box display="flex" gap={4}>
                    <TextField size="small" label="CRON" fullWidth value={cronExpression} onChange={(e) => setCronExpression(e.target.value)} />
                    <Timezone timezone={timezone} setTimezone={setTimezone} />
                </Box>

                <Typography fontSize={13} mt={1.5}>
                    {isValidCron(cronExpression) ? cronstrue.toString(cronExpression, { throwExceptionOnParseError: false }) : ''}
                </Typography>

                <Typography fontSize={15} fontWeight={700} mt={3}>
                    Expected next 20 occurrences
                </Typography>

                {/* Table */}
                {isValidCron(cronExpression) ? (
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
                                                {row.toLocaleDateString('en-US', {
                                                    weekday: 'short',
                                                })}
                                                ,
                                            </TableCell>
                                            <TableCell component="th" scope="row">
                                                {row.getDate()}
                                            </TableCell>
                                            <TableCell component="th" scope="row">
                                                {row.toLocaleDateString('en-US', {
                                                    month: 'short',
                                                })}
                                            </TableCell>
                                            <TableCell component="th" scope="row">
                                                {row.getFullYear()}
                                            </TableCell>
                                            <TableCell component="th" scope="row">
                                                {formatTime(row)}
                                            </TableCell>
                                            <TableCell component="th" scope="row">
                                                {timezone && timezone + ' ' + getTimeZoneOffSet(timezone)}
                                            </TableCell>
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
                <Typography sx={{ cursor: 'pointer' }} mt={1} color="primary.main" fontSize={13} onClick={() => setCronExpression('* * * * *')}>
                    Every minute
                </Typography>
                <Typography sx={{ cursor: 'pointer' }} mt={0.5} color="primary.main" fontSize={13} onClick={() => setCronExpression('*/30 * * * *')}>
                    Every 30 minutes
                </Typography>
                <Typography sx={{ cursor: 'pointer' }} mt={0.5} color="primary.main" fontSize={13} onClick={() => setCronExpression('0 * * * *')}>
                    Every hour
                </Typography>
                <Typography sx={{ cursor: 'pointer' }} mt={0.5} color="primary.main" fontSize={13} onClick={() => setCronExpression('0 */6 * * *')}>
                    Every 6 hours
                </Typography>
                <Typography sx={{ cursor: 'pointer' }} mt={0.5} color="primary.main" fontSize={13} onClick={() => setCronExpression('0 8 * * *')}>
                    Every day at 8am ({timezone})
                </Typography>
                <Typography sx={{ cursor: 'pointer' }} mt={0.5} color="primary.main" fontSize={13} onClick={() => setCronExpression('0 11 * * 5')}>
                    Every Friday at 11am ({timezone})
                </Typography>
                <Typography sx={{ cursor: 'pointer' }} mt={0.5} color="primary.main" fontSize={13} onClick={() => setCronExpression('0 23 * * 1-5')}>
                    At 11pm, Monday through Friday ({timezone})
                </Typography>
                <Typography sx={{ cursor: 'pointer' }} mt={0.5} color="primary.main" fontSize={13} onClick={() => setCronExpression('0 14 5 * *')}>
                    Every month on day 5 at 2pm ({timezone})
                </Typography>
            </Box>
        </Box>
    );
}

// Utility functions
function formatTime(date) {
    const hours = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
    const minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
    const seconds = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
    return hours + ':' + minutes + ':' + seconds;
}

// Takes timezone name and return its offset
// Example 'Europe/Istanbul' => (GMT+3)
function getTimeZoneOffSet(timezoneName) {
    return '(' + new Intl.DateTimeFormat('en', { timeZoneName: 'short', timeZone: timezoneName }).format(new Date()).split(' ')[1] + ')';
}
