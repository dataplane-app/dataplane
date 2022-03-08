import { Box, Button, Drawer, Grid, TextField, Typography, Autocomplete } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import { useGetSecret } from '../graphql/getSecret';
import { useUpdateSecret } from '../graphql/updateSecret';
import { useAddSecretToWorkerGroup } from '../graphql/addSecretToWorkerGroup';
import { useGetWorkerGroups } from '../graphql/getWorkerGroups';
import { useGetSecretGroups } from '../graphql/getSecretWorkerGroups';
import { useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useGlobalEnvironmentState } from '../components/EnviromentDropdown';
import { useDeleteSecretFromWorkerGroup } from '../graphql/deleteSecretFromWorkerGroup';
import DeleteSecretDrawer from '../components/DrawerContent/DeleteSecretDrawer';
import ChangeSecretDrawer from '../components/DrawerContent/ChangeSecretDrawer';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';

const SecretDetail = () => {
    // Global environment state with hookstate
    const Environment = useGlobalEnvironmentState();

    // URI parameter
    const { secretId } = useParams();

    // Local State
    const [secret, setSecret] = useState(null);
    const [workerGroup, setWorkerGroup] = useState('');
    const [workerGroups, setWorkerGroups] = useState([]);
    const [secretWorkerGroups, setSecretWorkerGroups] = useState([]);

    // Control States
    const [isOpenDeleteSecret, setIsOpenDeleteSecret] = useState(false);
    const [isOpenChangeSecret, setIsOpenChangeSecret] = useState(false);
    const [firstRender, setFirstRender] = useState(true);
    const [clear, setClear] = useState(1);

    // Ref for scroll to top
    const scrollRef = useRef(null);

    // Form
    const { register, handleSubmit, watch, reset } = useForm();

    // Custom GraphQL hooks
    const getSecret = useGetSecret_(secretId, setSecret, Environment, reset);
    const getUpdateSecret = useUpdateSecret_(setSecret, Environment, getSecret);
    const getSecretWorkerGroups = useGetSecretGroups_(Environment.name.get(), secretId, setSecretWorkerGroups);
    const addSecretToWorkerGroup = useAddSecretToWorkerGroup_(Environment.name.get(), workerGroup, secretId, getSecretWorkerGroups);
    const getWorkerGroups = useGetWorkerGroupsHook(Environment.id.get(), setWorkerGroups);
    const deleteSecretFromWorkerGroup = useDeleteSecretFromWorkerGroup_(Environment.name.get(), secretId, getSecretWorkerGroups);

    useEffect(() => {
        // Scroll to top on load
        scrollRef.current.parentElement.scrollIntoView();

        // Get secret details and worker groups on load after the environment is available
        if (Environment.id.get() && firstRender) {
            getSecret();
            getWorkerGroups();
            setFirstRender(false);
            getSecretWorkerGroups();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Environment.id.get()]);

    return (
        <>
            <Box className="page" ref={scrollRef}>
                <Typography component="h2" variant="h2" color="text.primary">
                    Secrets {' > '} {secret?.Secret}
                </Typography>

                <Grid container alignItems="flex-start" gap={20} mt={4}>
                    <Box sx={{ width: '250px' }}>
                        {secret ? (
                            <form onSubmit={handleSubmit(getUpdateSecret)}>
                                <Typography variant="subtitle2" mt={1} mb={3}>
                                    Environment variable: {secret?.SecretType === 'environment' ? 'secret_' : 'secret_dp_'}
                                    {watch('name') && watch('name').toLowerCase()}
                                </Typography>

                                <TextField label="Description" id="description" size="small" sx={{ mb: 2, fontSize: '.75rem', display: 'flex' }} {...register('description')} />

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

                    {secret?.SecretType === 'custom' ? (
                        <Box sx={{ width: '300px' }}>
                            <>
                                <Typography variant="h3" mt={1} mb={3}>
                                    Worker Groups
                                </Typography>

                                <Box sx={{ display: 'flex' }}>
                                    <Autocomplete
                                        disablePortal
                                        freeSolo
                                        fullWidth
                                        id="combo-box-demo"
                                        key={clear} //Changing this value on submit clears the input field
                                        onChange={(event, newValue) => {
                                            setWorkerGroup(newValue);
                                        }}
                                        onInputChange={(event, newValue) => {
                                            setWorkerGroup(newValue);
                                        }}
                                        // Filter out already selected worker groups
                                        options={workerGroups.map((a) => a.WorkerGroup).filter((a) => !secretWorkerGroups.map((a) => a.WorkerGroupID).includes(a))}
                                        renderInput={(params) => <TextField {...params} label="Worker Group ID" size="small" sx={{ fontSize: '.75rem' }} />}
                                    />

                                    <Button
                                        onClick={() => {
                                            workerGroup && addSecretToWorkerGroup();
                                            setClear(clear * -1); // Clears autocomplete input field
                                            setWorkerGroup('');
                                        }}
                                        variant="contained"
                                        size="small"
                                        sx={{ marginLeft: '10px' }}>
                                        Add
                                    </Button>
                                </Box>

                                <Box mt={3}>
                                    {secretWorkerGroups.map((env) => (
                                        <Grid display="flex" alignItems="center" key={env.WorkerGroupID} mt={1.5} mb={1.5}>
                                            <Box
                                                onClick={() => deleteSecretFromWorkerGroup(env.WorkerGroupID)}
                                                component={FontAwesomeIcon}
                                                sx={{ fontSize: '17px', mr: '7px', color: 'rgba(248, 0, 0, 1)', cursor: 'pointer' }}
                                                icon={faTrashAlt}
                                            />
                                            <Typography variant="subtitle2" lineHeight="15.23px">
                                                {env.WorkerGroupID}
                                            </Typography>
                                        </Grid>
                                    ))}
                                </Box>
                            </>
                        </Box>
                    ) : null}
                </Grid>
            </Box>

            <Drawer anchor="right" open={isOpenDeleteSecret} onClose={() => setIsOpenDeleteSecret(!isOpenDeleteSecret)}>
                <DeleteSecretDrawer environmentId={Environment.id.get()} secretName={secretId} handleClose={() => setIsOpenDeleteSecret(false)} />
            </Drawer>

            <Drawer anchor="right" open={isOpenChangeSecret} onClose={() => setIsOpenChangeSecret(!isOpenChangeSecret)}>
                <ChangeSecretDrawer environmentId={Environment.id.get()} secretName={secretId} handleClose={() => setIsOpenChangeSecret(false)} />
            </Drawer>
        </>
    );
};

export default SecretDetail;

// ----------- Custom Hook
const useGetSecret_ = (secret, setSecret, Environment, reset) => {
    // GraphQL hook
    const getSecrets = useGetSecret();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get secret
    return async () => {
        const response = await getSecrets({ environmentId: Environment.id.get(), secret });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get secrets: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
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
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            setSecrets(response);
            getSecret();
        }
    };
};

const useAddSecretToWorkerGroup_ = (environmentName, WorkerGroup, Secret, getSecretWorkerGroups) => {
    // GraphQL hook
    const addSecretToWorkerGroup = useAddSecretToWorkerGroup();

    const { enqueueSnackbar } = useSnackbar();

    // Update secret
    return async () => {
        const response = await addSecretToWorkerGroup({ environmentName, WorkerGroup, Secret });

        if (response.r === 'error') {
            enqueueSnackbar("Can't update secrets: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getSecretWorkerGroups();
        }
    };
};

const useGetWorkerGroupsHook = (environmentID, setWorkerGroups) => {
    // GraphQL hook
    const getAccessGroupUsers = useGetWorkerGroups();

    const { enqueueSnackbar } = useSnackbar();

    // Get worker groups
    return async () => {
        const response = await getAccessGroupUsers({ environmentID });

        if (response === null) {
            setWorkerGroups([]);
        } else if (response.r === 'error') {
            enqueueSnackbar("Can't get worker groups: " + response.msg, { variant: 'error' });
        } else if (response.r === 'Unauthorized') {
            enqueueSnackbar('Idle: not polling', { variant: 'warning' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setWorkerGroups(response);
        }
    };
};

const useGetSecretGroups_ = (environmentName, Secret, setSecretWorkerGroups) => {
    // GraphQL hook
    const getSecretGroups = useGetSecretGroups();

    const { enqueueSnackbar } = useSnackbar();

    // Get worker groups
    return async () => {
        const response = await getSecretGroups({ environmentName, Secret });

        if (response === null) {
            setSecretWorkerGroups([]);
        } else if (response.r === 'error') {
            enqueueSnackbar("Can't get secret's worker groups: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setSecretWorkerGroups(response);
        }
    };
};

const useDeleteSecretFromWorkerGroup_ = (environmentName, Secret, getSecretWorkerGroups) => {
    // GraphQL hook
    const deletePermissionToUser = useDeleteSecretFromWorkerGroup();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Delete secret from worker group
    return async (WorkerGroup) => {
        const response = await deletePermissionToUser({ environmentName, WorkerGroup, Secret });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't remove secret from worker group: " + response.msg, {
                variant: 'error',
            });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getSecretWorkerGroups();
        }
    };
};
