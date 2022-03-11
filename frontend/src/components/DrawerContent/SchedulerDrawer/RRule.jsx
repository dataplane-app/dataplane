import { Autocomplete, Box, Link, Paper, Table, TableBody, TableCell, TableContainer, TableRow, TextField, Typography } from '@mui/material';
import ct from 'countries-and-timezones';
import { RRule } from 'rrule';

export function RRuleTab() {
    const rule = new RRule({
        freq: RRule.WEEKLY,
        count: 30,
        interval: 1,
    });

    console.log(rule.all());
    return false ? (
        <Box display="flex" gap={8}>
            {/* Left Side */}
            <Box mt={1} sx={{ width: 650 }}>
                <Box display="flex" gap={4}>
                    <CronText />

                    <Autocomplete
                        // value={user.timezone}
                        id="timezone-autocomplete"
                        sx={{ width: 400 }}
                        onChange={(event, newValue) => {
                            // setUser({ ...user, timezone: newValue });
                        }}
                        options={Object.keys(ct.getAllTimezones())}
                        renderInput={(params) => <TextField {...params} label="Timezone" id="timezone" size="small" sx={{ fontSize: '.75rem', display: 'flex' }} />}
                    />
                </Box>

                <Typography fontSize={13} mt={1.5}>
                    At 11:00 PM, Monday through Friday
                </Typography>

                <Typography fontSize={15} fontWeight={700} mt={3}>
                    Expected next 20 occurrences
                </Typography>

                {/* Table */}
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
                            {rule.all().map((row, idx) => {
                                // console.log(new Date(row).getFullYear());
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

            {/* Right Side */}
        </Box>
    ) : null;
}

function CronText({}) {
    return <TextField size="small" label="CRON" fullWidth />;
}
