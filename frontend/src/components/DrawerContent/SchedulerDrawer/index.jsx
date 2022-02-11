import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Autocomplete, Box, Button, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableRow, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { RRule } from 'rrule';

const ScheduleDrawer = ({ handleClose, refreshData }) => {
    const rule = new RRule({
        freq: RRule.WEEKLY,
        count: 30,
        interval: 1,
    });

    console.log(rule.all());

    const [type, setType] = useState();
    const { register, handleSubmit } = useForm();

    async function onSubmit(data) {
        console.log(data);
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
                                required
                                sx={{ mb: 2, mt: 2, fontSize: '.75rem', display: 'flex' }}
                                {...register('schedule', { required: true })}
                            />
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
                                        console.log(new Date(row).getFullYear());
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
