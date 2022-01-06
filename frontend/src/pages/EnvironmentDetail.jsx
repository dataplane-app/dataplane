import { Box, Button, Drawer, Grid, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import DeleteEnvironmentDrawer from '../components/DrawerContent/DeleteEnvironmentDrawer';
import drawerStyles from '../utils/drawerStyles';

const EnvironmentDetail = () => {
    // States
    const [isOpenDeleteEnvDrawer, setIsOpenDeleteEnvDrawer] = useState(false);

    // URI parameter
    const { environmentId } = useParams();

    // Fetch environment details
    // ---

    const { register, handleSubmit } = useForm();

    async function onSubmit(data) {
        console.log(data);
    }

    return (
        <>
            <Box className="page" sx={{ width: { sm: '50%' } }}>
                <Typography component="h2" variant="h2" color="text.primary">
                    Settings {' > '} Environments {' > '} Development
                </Typography>

                <Box mt={5} sx={{ width: '250px' }}>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <TextField label="Name" id="name" size="small" required sx={{ mb: 2, fontSize: '.75rem', display: 'flex' }} {...register('name', { required: true })} />

                        <TextField
                            label="Description"
                            id="description"
                            size="small"
                            required
                            sx={{ mb: 2, fontSize: '.75rem', display: 'flex' }}
                            {...register('description', { required: true })}
                        />

                        <Grid mt={3} display="flex" alignItems="center">
                            <Button type="submit" variant="contained" color="primary" style={{ width: '100%' }}>
                                Save
                            </Button>
                        </Grid>
                    </form>
                    <Box sx={{ margin: '2.45rem 0', borderTop: 1, borderColor: 'divider' }}></Box>

                    <Button
                        onClick={() => {}}
                        size="small"
                        variant="outlined"
                        color="error"
                        sx={{ fontWeight: '700', width: '100%', fontSize: '.81rem', border: 2, '&:hover': { border: 2 } }}>
                        Deactivate environment
                    </Button>

                    <Button
                        onClick={() => setIsOpenDeleteEnvDrawer(true)}
                        size="small"
                        variant="outlined"
                        color="error"
                        sx={{ fontWeight: '700', width: '100%', mt: '3.56rem', fontSize: '.81rem', border: 2, '&:hover': { border: 2 } }}>
                        Delete environment
                    </Button>

                    <Typography color="rgba(248, 0, 0, 1)" lineHeight="15.23px" sx={{ mt: '.56rem' }} variant="subtitle2">
                        Warning: this action can’t be undone.
                    </Typography>
                </Box>
            </Box>

            <Drawer anchor="right" open={isOpenDeleteEnvDrawer} onClose={() => setIsOpenDeleteEnvDrawer(!isOpenDeleteEnvDrawer)} sx={drawerStyles}>
                <DeleteEnvironmentDrawer handleClose={() => setIsOpenDeleteEnvDrawer(false)} envName="Development" />
            </Drawer>
        </>
    );
};

export default EnvironmentDetail;
