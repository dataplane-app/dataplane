import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableRow, TextField, Typography } from '@mui/material';
import { DateTime } from 'luxon';

export function CronSecondsTab({ seconds, setSeconds, timezone }) {
    return (
        <Box display="flex" flexDirection="column">
            <Box mt={1} sx={{ width: 650 }} display="flex" alignItems="center">
                <Typography fontSize={15} fontWeight={700} mr={3}>
                    Run every
                </Typography>
                <TextField size="small" value={seconds} label="Seconds" id="schedule" onChange={(e) => setSeconds(e.target.value)} />
            </Box>

            <Typography fontSize={15} fontWeight={700} mb={2} mt={6}>
                Expected 20 occurrences
            </Typography>
            {/* Table */}
            {seconds > 0 ? (
                <TableContainer component={Paper} sx={{ width: 650 }}>
                    <Table
                        sx={{
                            minWidth: 650,
                        }}
                        aria-label="simple table">
                        <TableBody>
                            {calculateNext20(seconds, timezone).map((a, idx) => (
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
                                        {DateTime.fromISO(a, { zone: timezone }).toFormat('EEE')},
                                    </TableCell>
                                    <TableCell component="th" scope="row">
                                        {DateTime.fromISO(a, { zone: timezone }).toFormat('M')}
                                    </TableCell>
                                    <TableCell component="th" scope="row">
                                        {DateTime.fromISO(a, { zone: timezone }).toFormat('MMM')}
                                    </TableCell>
                                    <TableCell component="th" scope="row">
                                        {DateTime.fromISO(a, { zone: timezone }).toFormat('yyyy')}
                                    </TableCell>
                                    <TableCell component="th" scope="row">
                                        {DateTime.fromISO(a, { zone: timezone }).toFormat('TT')}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : null}
        </Box>
    );
}

// Utility functions
function calculateNext20(seconds, zone) {
    const now = DateTime.fromJSDate(new Date(), { zone }).toISO();
    const arr = [now];
    for (let index = 1; index < 20; index++) {
        arr.push(
            DateTime.fromISO(now)
                .plus({ seconds: index * seconds })
                .toISO()
        );
    }
    return arr;
}
