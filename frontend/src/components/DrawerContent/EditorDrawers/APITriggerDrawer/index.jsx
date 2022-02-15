import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Autocomplete, Box, Button, Grid, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

const APITRiggerDrawer = ({ handleClose, refreshData }) => {
    const [secret, setSecret] = useState();
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

                    <Box mt={3}>
                        <Typography component="h2" variant="h2">
                            Trigger - API
                        </Typography>

                        <Typography fontSize={15} sx={{ color: 'secondary.main' }}>
                            Experimental feature
                        </Typography>

                        <Box mt={3}>
                            <Typography fontSize={15}>Endpoint: https://localhost:9000/32845-238467-96929</Typography>
                        </Box>

                        <Grid container alignItems="center" flexWrap="nowrap" mt={1}>
                            <Typography fontSize={15} flex={1}>
                                Authentication header:
                            </Typography>
                            <Autocomplete
                                sx={{ width: '100%', flex: 1 }}
                                disablePortal
                                value={secret}
                                id="combo-box-demo"
                                onChange={(event, newValue) => {
                                    setSecret(newValue);
                                }}
                                options={[]}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Secret"
                                        id="secret"
                                        size="small"
                                        sx={{ fontSize: '.75rem', display: 'flex', width: '100%' }}
                                        {...register('secret')}
                                    />
                                )}
                            />
                        </Grid>

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

                        <Box mt={2}>
                            <Typography>curl .... </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </form>
    );
};

export default APITRiggerDrawer;
