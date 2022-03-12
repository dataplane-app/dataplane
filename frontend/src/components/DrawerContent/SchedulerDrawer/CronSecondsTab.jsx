import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableRow, TextField, Typography } from '@mui/material';

export function CronSecondsTab({ seconds, setSeconds }) {
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
                        <TableBody>{SecondsTable(new Date(), seconds)}</TableBody>
                    </Table>
                </TableContainer>
            ) : null}
        </Box>
    );

    function SecondsTable(date) {
        const table = [];

        for (let idx = 1; idx < 21; idx++) {
            table.push(
                <TableRow
                    key={idx}
                    sx={{
                        '&:last-child td, &:last-child th': {
                            border: 0,
                        },
                    }}>
                    <TableCell component="th" scope="row">
                        {idx}
                    </TableCell>
                    <TableCell component="th" scope="row">
                        {date.toLocaleDateString('en-US', {
                            weekday: 'short',
                        })}
                        ,
                    </TableCell>
                    <TableCell component="th" scope="row">
                        {date.getDate}
                    </TableCell>
                    <TableCell component="th" scope="row">
                        {date.toLocaleDateString('en-US', {
                            month: 'short',
                        })}
                    </TableCell>
                    <TableCell component="th" scope="row">
                        {date.getFullYear()}
                    </TableCell>
                    <TableCell component="th" scope="row">
                        {formatTime(date, seconds, idx)}
                    </TableCell>
                </TableRow>
            );
        }

        return table;
    }
}

// Utility functions
function formatTime(date, s, idx) {
    date = date.getTime() + s * idx * 1000;
    date = new Date(date);
    const hours = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
    const minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
    const seconds = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
    return hours + ':' + minutes + ':' + seconds;
}
