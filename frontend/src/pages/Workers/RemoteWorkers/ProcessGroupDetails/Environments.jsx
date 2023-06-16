import { useEffect, useState } from 'react';
import { Box, Typography, Button, Grid, Autocomplete, TextField } from '@mui/material';
import { useSnackbar } from 'notistack';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAddRemoteProcessGroupToEnvironment } from '../../../../graphql/addRemoteProcessGroupToEnvironment';
import { useGetRemoteProcessGroupsEnvironments } from '../../../../graphql/getRemoteProcessGroupsEnvironments';
import { useRemoveRemoteProcessGroupFromEnvironment } from '../../../../graphql/removeRemoteProcessGroupFromEnvironment';
import { useGlobalEnvironmentsState } from '../../../../components/EnviromentDropdown';

export default function Environments({ environmentId, remoteEnvironments, setRemoteEnvironments }) {
    // Environments global state
    const globalEnvironments = useGlobalEnvironmentsState();

    // Control states
    const [clear, setClear] = useState(1);

    const { register, handleSubmit } = useForm();

    // Custom GraphQL hooks
    const getRemoteProcessGroupsEnvironments = useGetRemoteProcessGroupsEnvironmentsHook(environmentId, setRemoteEnvironments);
    const addRemoteProcessGroupToEnvironment = useAddRemoteProcessGroupToEnvironmentHook(getRemoteProcessGroupsEnvironments);
    const removeRemoteProcessGroupFromEnvironment = useRemoveRemoteProcessGroupFromEnvironmentHook(getRemoteProcessGroupsEnvironments);

    useEffect(() => {
        getRemoteProcessGroupsEnvironments();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [environmentId]);

    return (
        <Box>
            <Typography component="h3" variant="h3" color="text.primary">
                Environments
            </Typography>

            <form style={{ marginTop: '16px', display: 'flex', alignItems: 'center' }} onSubmit={handleSubmit(addRemoteProcessGroupToEnvironment)}>
                <Autocomplete
                    disablePortal
                    id="available_environments_autocomplete"
                    key={clear} //Changing this value on submit clears the input field
                    sx={{ minWidth: '280px' }}
                    // Filter out user's permissions from available permissions
                    options={globalEnvironments.get().filter((row) => !remoteEnvironments.map((a) => a.environmentID).includes(row.id)) || ''}
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
                        <Grid display="flex" alignItems="center" key={env.name} mt={1.5} mb={1.5}>
                            <Box
                                onClick={() => removeRemoteProcessGroupFromEnvironment(env.environmentID)}
                                component={FontAwesomeIcon}
                                sx={{ fontSize: '17px', mt: -3, mr: '7px', color: 'rgba(248, 0, 0, 1)', cursor: 'pointer' }}
                                icon={faTrashAlt}
                            />

                            <Box display="flex" flexDirection="column">
                                <Typography variant="subtitle2" lineHeight="15.23px">
                                    {env.name}
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
const useGetRemoteProcessGroupsEnvironmentsHook = (environmentID, setRemotePackages) => {
    // GraphQL hook
    const getRemoteProcessGroupsEnvironments = useGetRemoteProcessGroupsEnvironments();

    const { groupId } = useParams();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const globalEnvironments = useGlobalEnvironmentsState();

    // Get environments on load
    return async () => {
        const response = await getRemoteProcessGroupsEnvironments({ environmentID, remoteProcessGroupID: groupId });

        if (response.r || response.error) {
            closeSnackbar();
            enqueueSnackbar("Can't get environments: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            let namedResponse = response.map((packages) => ({
                ...packages,
                name: globalEnvironments.get().find((env) => env.id === packages.environmentID)?.name,
            }));
            setRemotePackages(namedResponse);
        }
    };
};

const useAddRemoteProcessGroupToEnvironmentHook = (getRemoteProcessGroupsEnvironments) => {
    // GraphQL hook
    const addRemoteProcessGroupToEnvironment = useAddRemoteProcessGroupToEnvironment();

    const { enqueueSnackbar } = useSnackbar();

    const { groupId } = useParams();

    const globalEnvironments = useGlobalEnvironmentsState();

    // Add remote worker environment
    return async (data) => {
        if (!data?.environment) return;

        // Get id of selected environment
        let environmentID = globalEnvironments.get().find((a) => a.name === data.environment).id;

        const dataFinal = {
            environmentID,
            remoteProcessGroupID: groupId,
            workerID: '',
        };

        const response = await addRemoteProcessGroupToEnvironment(dataFinal);

        if (response.r || response.error) {
            enqueueSnackbar("Can't get remote packages: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getRemoteProcessGroupsEnvironments();
        }
    };
};

const useRemoveRemoteProcessGroupFromEnvironmentHook = (getRemoteProcessGroupsEnvironments) => {
    // GraphQL hook
    const removeRemoteProcessGroupFromEnvironment = useRemoveRemoteProcessGroupFromEnvironment();

    const { enqueueSnackbar } = useSnackbar();

    const { groupId } = useParams();

    // Delete a remote environment
    return async (environmentID) => {
        const response = await removeRemoteProcessGroupFromEnvironment({ environmentID, remoteProcessGroupID: groupId });

        if (response.r || response.error) {
            enqueueSnackbar("Can't delete remote environment: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getRemoteProcessGroupsEnvironments();
        }
    };
};
