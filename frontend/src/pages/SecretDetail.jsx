import { Box, Button, Drawer, Grid, TextField, Typography } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import { useGetSecret } from '../graphql/getSecret';
import { useUpdateSecret } from '../graphql/updateSecret';
import { useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useGlobalEnvironmentState } from '../components/EnviromentDropdown';
import DeleteSecretDrawer from '../components/DrawerContent/DeleteSecretDrawer';
import ChangeSecretDrawer from '../components/DrawerContent/ChangeSecretDrawer';

const SecretDetail = () => {
    // Global environment state with hookstate
    const Environment = useGlobalEnvironmentState();

    // Secret State
    const [secret, setSecret] = useState(null);

    // Control States
    const [isOpenDeleteSecret, setIsOpenDeleteSecret] = useState(false);
    const [isOpenChangeSecret, setIsOpenChangeSecret] = useState(false);
    const [firstRender, setFirstRender] = useState(true);

    // Ref for scroll to top
    const scrollRef = useRef(null);

    // Form
    const { register, handleSubmit, watch, reset } = useForm();

    // Custom GraphQL hooks
    const getSecret = useGetSecret_(setSecret, Environment, reset);
    const getUpdateSecret = useUpdateSecret_(setSecret, Environment, getSecret);

    useEffect(() => {
        // Scroll to top on load
        scrollRef.current.parentElement.scrollIntoView();

        // Get secret details on load, once the environment is available
        if (Environment.id.get() && firstRender) {
            getSecret();
            setFirstRender(false);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Environment.id.get()]);

    return (
        <>
            <Box className="page" ref={scrollRef}>
                <Typography component="h2" variant="h2" color="text.primary">
                    Secrets {' > '} {secret?.Secret}
                </Typography>

                <Grid container alignItems="flex-start" mt={4}>
                    <Box sx={{ width: '250px' }}>
                        {secret ? (
                            <form onSubmit={handleSubmit(getUpdateSecret)}>
                                <Typography variant="subtitle2" mt={1} mb={3}>
                                    Environment variable: {secret?.SecretType === 'environment' ? 'secret_' : 'secret_dp_'}
                                    {watch('name') && watch('name').toLowerCase()}
                                </Typography>

                                <TextField
                                    label="Description"
                                    id="description"
                                    size="small"
                                    required
                                    sx={{ mb: 2, fontSize: '.75rem', display: 'flex' }}
                                    {...register('description', { required: true })}
                                />

                                <Grid container alignItems="center" mt={2} mb={2}>
                                    <Box component={FontAwesomeIcon} sx={{ color: '#70AD46', fontSize: 16 }} icon={faLock} />
                                    <Typography ml={1.5} mr={4} flex={1} variant="subtitle1">
                                        Secret: ******
                                    </Typography>
                                    <Button variant="text" onClick={() => setIsOpenChangeSecret(true)}>
                                        Change
                                    </Button>
                                </Grid>

                                <Grid mt={3} display="flex" alignItems="center">
                                    <Button type="submit" variant="contained" color="primary" style={{ width: '100%' }}>
                                        Save
                                    </Button>
                                </Grid>
                            </form>
                        ) : null}

                        <Box sx={{ margin: '2.45rem 0', borderTop: 1, borderColor: 'divider' }}></Box>

                        <Button
                            onClick={() => setIsOpenDeleteSecret(true)}
                            size="small"
                            variant="outlined"
                            color="error"
                            sx={{ fontWeight: '700', width: '100%', fontSize: '.81rem', border: 2, '&:hover': { border: 2 } }}>
                            Delete secret
                        </Button>

                        <Typography color="rgba(248, 0, 0, 1)" lineHeight="15.23px" sx={{ mt: '.56rem' }} variant="subtitle2">
                            Warning: this action can't be undone.
                        </Typography>
                    </Box>
                </Grid>
            </Box>

            <Drawer anchor="right" open={isOpenDeleteSecret} onClose={() => setIsOpenDeleteSecret(!isOpenDeleteSecret)}>
                <DeleteSecretDrawer environmentId={Environment.id.get()} secretName={secret?.Secret} handleClose={() => setIsOpenDeleteSecret(false)} />
            </Drawer>

            <Drawer anchor="right" open={isOpenChangeSecret} onClose={() => setIsOpenChangeSecret(!isOpenChangeSecret)}>
                <ChangeSecretDrawer environmentId={Environment.id.get()} secretName={secret?.Secret} handleClose={() => setIsOpenChangeSecret(false)} />
            </Drawer>
        </>
    );
};

export default SecretDetail;

// ----------- Custom Hook
const useGetSecret_ = (setSecret, Environment, reset) => {
    // GraphQL hook
    const getSecrets = useGetSecret();

    // URI parameter
    const { secretId } = useParams();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get secret
    return async () => {
        const response = await getSecrets({ environmentId: Environment.id.get(), secret: secretId });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get secrets: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': get secrets failed', { variant: 'error' }));
        } else {
            setSecret(response);

            // Reset form default values to incoming user data
            reset({
                name: response.Secret,
                description: response.Description,
            });
        }
    };
};

const useUpdateSecret_ = (setSecrets, Environment, getSecret) => {
    // GraphQL hook
    const updateSecret = useUpdateSecret();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Update secret
    return async (data) => {
        const variables = {
            input: {
                Secret: data.name,
                Description: data.description,
                Active: true,
                EnvironmentId: Environment.id.get(),
            },
        };

        const response = await updateSecret(variables);

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't update secrets: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': update secrets failed', { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            setSecrets(response);
            getSecret();
        }
    };
};
