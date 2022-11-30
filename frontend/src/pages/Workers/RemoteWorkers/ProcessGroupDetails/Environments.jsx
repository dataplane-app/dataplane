import { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Autocomplete, TextField } from '@mui/material';
import { useSnackbar } from 'notistack';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { useGetEnvironments } from '../../../../graphql/getEnvironments';
import { useDeleteRemoteWorkerEnvironment } from '../../../../graphql/deleteRemoteWorkerEnvironment';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAddRemoteWorkerEnvironment } from '../../../../graphql/addRemoteWorkerEnvironment';
import { useGetRemoteWorkerEnvironments } from '../../../../graphql/getRemoteWorkerEnvironments';

export default function Environments({ environmentId, remoteEnvironments, setRemoteEnvironments }) {
    // User states
    const [availableEnvironments, setAvailableEnvironments] = useState([]);

    // Control states
    const [clear, setClear] = useState(1);

    const { register, handleSubmit } = useForm();

    // Custom GraphQL hooks
    const getEnvironmentsAndPackages = useGetEnvironmentPackagesData(setAvailableEnvironments, environmentId, setRemoteEnvironments);
    const getRemoteEnvironments = useGetRemoteWorkerEnvironmentsHook(environmentId, setRemoteEnvironments, availableEnvironments);
    const addRemoteWorkerEnvironment = useAddRemoteWorkerEnvironmentHook(availableEnvironments, getRemoteEnvironments);
    const deleteRemoteWorkerEnvironment = useDeleteRemoteWorkerEnvironmentHook(getRemoteEnvironments);

    useEffect(() => {
        getEnvironmentsAndPackages();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [environmentId]);

    return (
        <Box>
            <Typography component="h3" variant="h3" color="text.primary">
                Environments
            </Typography>

            <form style={{ marginTop: '16px', display: 'flex', alignItems: 'center' }} onSubmit={handleSubmit(addRemoteWorkerEnvironment)}>
                <Autocomplete
                    disablePortal
                    id="available_environments_autocomplete"
                    key={clear} //Changing this value on submit clears the input field
                    sx={{ minWidth: '280px' }}
                    // Filter out user's permissions from available permissions
                    options={availableEnvironments.filter((row) => !remoteEnvironments.map((a) => a.EnvironmentID).includes(row.id)) || ''}
                    getOptionLabel={(option) => option.name}
                    renderInput={(params) => (
                        <TextField
                            {...params} //
                            label="Environments"
                            id="environment"
                            size="small"
                            {...register('environment')}
                            sx={{ fontSize: '.75rem', display: 'flex' }}
                        />
                    )}
                />

                <Button
                    onClick={() => setClear(clear * -1)} // Clears autocomplete input field
                    variant="contained"
                    color="primary"
                    type="submit"
                    height="100%"
                    sx={{ ml: 1 }}>
                    Add
                </Button>
            </form>

            {/* Environments */}
            <Box mt="2.31rem">
                <Box mt={2}>
                    {remoteEnvironments.map((env) => (
                        <Grid display="flex" alignItems="center" key={env.Name} mt={1.5} mb={1.5}>
                            <Box
                                onClick={() => deleteRemoteWorkerEnvironment(env.EnvironmentID)}
                                component={FontAwesomeIcon}
                                sx={{ fontSize: '17px', mt: -3, mr: '7px', color: 'rgba(248, 0, 0, 1)', cursor: 'pointer' }}
                                icon={faTrashAlt}
                            />

                            <Box display="flex" flexDirection="column">
                                <Typography variant="subtitle2" lineHeight="15.23px">
                                    {env.Name}
                                </Typography>

                                <Typography variant="subtitle1">Python workers for generic work loads.</Typography>
                            </Box>
                        </Grid>
                    ))}
                </Box>
            </Box>
        </Box>
    );
}

// ** Custom Hooks
const useGetEnvironmentPackagesData = (setAvailableEnvironments, environmentID, setRemotePackages) => {
    // ** GET Environments
    // GraphQL hook
    const getEnvironments = useGetEnvironments();
    const getRemoteWorkerEnvironments = useGetRemoteWorkerEnvironments();

    const { groupId } = useParams();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get environments on load
    return async () => {
        const response = await getEnvironments();

        if (response.r || response.error) {
            closeSnackbar();
            enqueueSnackbar("Can't get environments: " + (response.msg || response.r || response.error), { variant: 'error' });
            return;
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
            return;
        } else {
            setAvailableEnvironments(response);
        }

        const response2 = await getRemoteWorkerEnvironments({ environmentID, remoteProcessGroupID: groupId });
        if (response2.r || response2.error) {
            closeSnackbar();
            enqueueSnackbar("Can't get remote environments: " + (response2.msg || response2.r || response2.error), { variant: 'error' });
        } else if (response2.errors) {
            response2.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            let namedResponse = response2.map((packages) => ({
                ...packages,
                Name: response.find((env) => env.id === packages.EnvironmentID).name,
            }));
            setRemotePackages(namedResponse);
        }
    };
};

const useGetRemoteWorkerEnvironmentsHook = (environmentID, setRemotePackages, globalEnvironments) => {
    // GraphQL hook
    const getRemoteWorkerEnvironments = useGetRemoteWorkerEnvironments();

    const { groupId } = useParams();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get environments on load
    return async () => {
        const response = await getRemoteWorkerEnvironments({ environmentID, remoteProcessGroupID: groupId });

        if (response.r || response.error) {
            closeSnackbar();
            enqueueSnackbar("Can't get environments: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            let namedResponse = response.map((packages) => ({
                ...packages,
                Name: globalEnvironments.find((env) => env.id === packages.EnvironmentID)?.name,
            }));
            setRemotePackages(namedResponse);
        }
    };
};

const useAddRemoteWorkerEnvironmentHook = (availableEnvironments, getRemoteEnvironments) => {
    // GraphQL hook
    const addRemoteWorkerEnvironment = useAddRemoteWorkerEnvironment();

    const { enqueueSnackbar } = useSnackbar();

    const { groupId } = useParams();

    // Add remote worker environment
    return async (data) => {
        if (!data?.environment) return;

        // Get id of selected environment
        let environmentID = availableEnvironments.find((a) => a.name === data.environment).id;

        const dataFinal = {
            environmentID,
            remoteProcessGroupID: groupId,
            workerID: '',
        };

        const response = await addRemoteWorkerEnvironment(dataFinal);

        if (response.r || response.error) {
            enqueueSnackbar("Can't get remote packages: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getRemoteEnvironments();
        }
    };
};

const useDeleteRemoteWorkerEnvironmentHook = (getRemoteEnvironments) => {
    // GraphQL hook
    const deleteRemoteWorkerEnvironment = useDeleteRemoteWorkerEnvironment();

    const { enqueueSnackbar } = useSnackbar();

    const { groupId } = useParams();

    // Delete a remote environment
    return async (environmentID) => {
        const response = await deleteRemoteWorkerEnvironment({ environmentID, remoteProcessGroupID: groupId });

        if (response.r || response.error) {
            enqueueSnackbar("Can't delete remote environment: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getRemoteEnvironments();
        }
    };
};
