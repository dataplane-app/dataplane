import { Box, Button, Drawer, Grid, TextField, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import DeactivateEnvironmentDrawer from '../components/DrawerContent/DeactivateEnvironmentDrawer';
import DeleteEnvironmentDrawer from '../components/DrawerContent/DeleteEnvironmentDrawer';
import { useGetEnvironment } from '../graphql/environments/getEnvironment.js';
import { useUpdateEnvironment } from '../graphql/environments/updateEnvironment.js';

const EnvironmentDetail = () => {
    // Drawer States
    const [isOpenDeleteEnvDrawer, setIsOpenDeleteEnvDrawer] = useState(false);
    const [isOpenDeactivateEnvDrawer, setIsOpenDeactivateEnvDrawer] = useState(false);

    // Environment state
    const [environment, setEnvironment] = useState({});

    const { register, handleSubmit, reset } = useForm();

    // Ref for scroll to top
    const scrollRef = useRef(null);

    // Get environment data custom hook
    const getData = useGetData(setEnvironment, reset);

    useEffect(() => {
        // Scroll to top on load
        scrollRef.current.parentElement.scrollIntoView();

        getData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Submit environment data
    const onSubmit = useSubmitData(environment?.id);

    return (
        <>
            <Box className="page" sx={{ width: { sm: '50%' } }} ref={scrollRef}>
                <Typography component="h2" variant="h2" color="text.primary">
                    Settings {' > '} Environments {' > '} {environment?.name}
                </Typography>

                <Box mt={5} sx={{ width: '250px' }}>
                    {environment && environment.name ? (
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <TextField label="Name" id="name" size="small" required sx={{ mb: 2, fontSize: '.75rem', display: 'flex' }} {...register('name', { required: true })} />

                            <TextField label="Description" id="description" size="small" sx={{ mb: 2, fontSize: '.75rem', display: 'flex' }} {...register('description')} />

                            <Grid mt={3} display="flex" alignItems="center">
                                <Button type="submit" variant="contained" color="primary" style={{ width: '100%' }}>
                                    Save
                                </Button>
                            </Grid>
                        </form>
                    ) : null}
                    <Box sx={{ margin: '2.45rem 0', borderTop: 1, borderColor: 'divider' }}></Box>

                    {environment && Object.keys(environment).length > 0 ? (
                        <>
                            <Button
                                onClick={() => setIsOpenDeactivateEnvDrawer(true)}
                                size="small"
                                variant="outlined"
                                color={environment?.active ? 'error' : 'success'}
                                sx={{ fontWeight: '700', width: '100%', fontSize: '.81rem', border: 2, '&:hover': { border: 2 } }}>
                                {environment?.active ? 'Deactivate' : 'Activate'} environment
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
                        </>
                    ) : null}
                </Box>
            </Box>

            <Drawer anchor="right" open={isOpenDeleteEnvDrawer} onClose={() => setIsOpenDeleteEnvDrawer(!isOpenDeleteEnvDrawer)}>
                <DeleteEnvironmentDrawer handleClose={() => setIsOpenDeleteEnvDrawer(false)} environment={environment} />
            </Drawer>

            <Drawer anchor="right" open={isOpenDeactivateEnvDrawer} onClose={() => setIsOpenDeactivateEnvDrawer(!isOpenDeactivateEnvDrawer)}>
                <DeactivateEnvironmentDrawer environment={environment} refreshData={getData} handleClose={() => setIsOpenDeactivateEnvDrawer(false)} />
            </Drawer>
        </>
    );
};

export default EnvironmentDetail;

// --------- Custom hooks

const useGetData = (setEnvironment, reset) => {
    // GraphQL hook
    const getEnvironment = useGetEnvironment();

    // URI parameter
    const { environmentId } = useParams();

    // Get user data
    return async () => {
        const env = await getEnvironment({ environment_id: environmentId });

        if (env?.r !== 'error') {
            setEnvironment(env);

            // Reset form default values to incoming user data
            reset({
                name: env.name,
                description: env.description,
            });
        }
    };
};

const useSubmitData = (environment_id) => {
    // GraphQL hook
    const updateEnvironment = useUpdateEnvironment();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Update environment info
    return async function onSubmit(data) {
        const allData = {
            input: {
                id: environment_id,
                name: data.name,
                description: data.description ? data.description : '-',
            },
        };

        let response = await updateEnvironment(allData);
        if (response?.r !== 'error') {
            closeSnackbar();
            enqueueSnackbar(`Saved`, { variant: 'success' });
        } else {
            if (response.errors) {
                response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
            }
            if (response.r === 'error') {
                enqueueSnackbar(response.msg, { variant: 'error' });
            }
        }
    };
};
