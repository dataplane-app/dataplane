import { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Autocomplete, TextField } from '@mui/material';
import { useSnackbar } from 'notistack';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { useParams } from 'react-router-dom';

import { useGlobalMeState } from '../../components/Navbar';
import { useGlobalEnvironmentState } from '../../components/EnviromentDropdown';

import { useUpdatePermissionToAccessGroup } from '../../graphql/updatePermissionToAccessGroup';
import { useAvailablePermissions } from '../../graphql/availablePermissions';
import { useGetUserPermissions } from '../../graphql/getUserPermissions';
import { useDeletePermissionToUser } from '../../graphql/deletePermissionToUser';

export default function Permissions() {
    // Global user states with hookstate
    const MeData = useGlobalMeState();
    const Environment = useGlobalEnvironmentState();

    // User states
    const [availablePermissions, setAvailablePermissions] = useState([]);
    const [selectedPermission, setSelectedPermission] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [clear, setClear] = useState(1);

    // Custom GraphQL hooks
    const getAvailablePermissions = useGetAvailablePermissions(setAvailablePermissions, Environment.id.get());
    const getPermissions = useGetPermissions(setPermissions, Environment.id.get());
    const updatePermission = useUpdatePermissions(getPermissions, selectedPermission, Environment.id.get());
    const deletePermission = useDeletePermission(getPermissions);

    // Get permissions on load
    useEffect(() => {
        // Get permissions when environment is retrieved and if permissions is empty
        if (Environment.id.get() && permissions.length === 0) {
            getPermissions();
        }

        // Get all available permissions when environment is retrieved and if available permissions is empty
        if (Environment.id.get() && availablePermissions.length === 0) {
            getAvailablePermissions();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Environment, MeData]);

    return (
        <Box>
            <Typography component="h3" variant="h3" color="text.primary">
                Permissions
            </Typography>

            <Grid mt={2} display="flex" alignItems="center">
                <Autocomplete
                    disablePortal
                    id="available_permissions_autocomplete"
                    key={clear} //Changing this value on submit clears the input field
                    onChange={(event, newValue) => {
                        setSelectedPermission(newValue);
                    }}
                    sx={{ minWidth: '280px' }}
                    // Filter out user's permissions from available permissions
                    options={filterPermissionsDropdown(availablePermissions, permissions, Environment.id.get())}
                    getOptionLabel={(option) => option.Label}
                    renderInput={(params) => (
                        <TextField {...params} label="Available permissions" id="available_permissions" size="small" sx={{ fontSize: '.75rem', display: 'flex' }} />
                    )}
                />

                <Button
                    onClick={() => {
                        updatePermission();
                        setClear(clear * -1); // Clears autocomplete input field
                    }}
                    variant="contained"
                    color="primary"
                    height="100%"
                    sx={{ ml: 1 }}>
                    Add
                </Button>
            </Grid>

            {/* Check if there are any permissions. If not, hide the box */}
            {permissions.filter((plat) => plat.Level === 'platform').length ? (
                <Box mt={4}>
                    <Box>
                        <Typography component="h3" variant="h3" color="text.primary">
                            Platform
                        </Typography>
                    </Box>

                    <Box mt={2}>
                        {permissions
                            .filter((plat) => plat.Resource.includes('platform'))
                            .map((plat) => (
                                <Grid display="flex" alignItems="center" key={plat.Label} mt={1.5} mb={1.5}>
                                    <Box
                                        onClick={() => deletePermission(plat)}
                                        component={FontAwesomeIcon}
                                        sx={{
                                            fontSize: '17px',
                                            mr: '7px',
                                            color: 'rgba(248, 0, 0, 1)',
                                            cursor: 'pointer',
                                        }}
                                        icon={faTrashAlt}
                                    />
                                    <Typography variant="subtitle2" lineHeight="15.23px">
                                        {plat.Label}
                                    </Typography>
                                </Grid>
                            ))}
                    </Box>
                </Box>
            ) : null}

            {/* Check if there are any permissions. If not, hide the box */}
            {permissions.filter((env) => !env.Resource.includes('platform') && env.EnvironmentID === Environment.id.get()).length ? (
                <Box mt="2.31rem">
                    <Typography component="h3" variant="h3" color="text.primary">
                        Environment permissions
                    </Typography>
                    <Typography variant="subtitle2" mt=".20rem">
                        Environment: {Environment.name.get()}
                    </Typography>

                    <Box mt={2}>
                        {permissions
                            .filter((env) => !env.Resource.includes('platform') && env.EnvironmentID === Environment.id.get())
                            .map((env) => (
                                <Grid display="flex" alignItems="center" key={env.Label} mt={1.5} mb={1.5}>
                                    <Box
                                        onClick={() => deletePermission(env)}
                                        component={FontAwesomeIcon}
                                        sx={{ fontSize: '17px', mr: '7px', color: 'rgba(248, 0, 0, 1)', cursor: 'pointer' }}
                                        icon={faTrashAlt}
                                    />
                                    <Typography variant="subtitle2" lineHeight="15.23px">
                                        {env.Label}
                                    </Typography>
                                </Grid>
                            ))}
                    </Box>
                </Box>
            ) : null}
        </Box>
    );
}

// ----------- Custom Hooks --------------------------------
const useGetPermissions = (setUserPermissions, environmentID) => {
    // GraphQL hook
    const getPermissions = useGetUserPermissions();

    // URI parameter
    const { accessId } = useParams();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get permissions
    return async () => {
        if (environmentID !== null) {
            const response = await getPermissions({ userID: accessId, environmentID });

            if (response === null) {
                setUserPermissions([]);
            } else if (response.r === 'error') {
                closeSnackbar();
                enqueueSnackbar("Can't get permissions: " + response.msg, { variant: 'error' });
            } else if (response.errors) {
                response.errors.map((err) => enqueueSnackbar(err.message + ': get permissions', { variant: 'error' }));
            } else {
                setUserPermissions(response);
            }
        }
    };
};

const useUpdatePermissions = (getUserPermissions, selectedPermission, environmentID) => {
    // GraphQL hook
    const updatePermissionToUser = useUpdatePermissionToAccessGroup();

    // URI parameter
    const { accessId } = useParams();

    const { enqueueSnackbar } = useSnackbar();

    if (selectedPermission === null) return; // If add button is clicked without a selection

    // If level environment, set resource id to current environment's id
    if (selectedPermission.Level === 'environment') {
        selectedPermission.ResourceID = environmentID;
    }
    // Update permissions
    return async () => {
        const response = await updatePermissionToUser({
            environmentID,
            resource: selectedPermission.Code,
            resourceID: selectedPermission.ResourceID,
            access_group_id: accessId,
            access: selectedPermission.Access,
        });
        if (response.r === 'error') {
            enqueueSnackbar("Can't update permissions: " + response.msg, {
                variant: 'error',
            });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': update permissions', { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getUserPermissions();
        }
    };
};

const useGetAvailablePermissions = (setAvailablePermissions, environmentID) => {
    // GraphQL hook
    const getAvailablePermissions = useAvailablePermissions();

    const { enqueueSnackbar } = useSnackbar();

    return async () => {
        // Get available permissions
        const response = await getAvailablePermissions({ environmentID });

        if (response.r === 'error') {
            enqueueSnackbar("Can't get permissions: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': get available permissions', { variant: 'error' }));
        } else {
            setAvailablePermissions(response);
        }
    };
};

const useDeletePermission = (getUserPermissions) => {
    // GraphQL hook
    const deletePermissionToUser = useDeletePermissionToUser();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Delete a permission
    return async (permission) => {
        let user_id = permission.SubjectID;
        let permission_id = permission.ID;
        let environmentID = permission.EnvironmentID;

        const response = await deletePermissionToUser({ user_id, permission_id, environmentID });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't delete permission: " + response.msg, {
                variant: 'error',
            });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': delete permission', { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getUserPermissions();
        }
    };
};

// ----------- Utility Functions
// Filters permissions dropdown from selected permissions
function filterPermissionsDropdown(availablePermissions, userPermissions, globalEnvironmentId) {
    return [
        // Filter platform permissions
        ...availablePermissions.filter(
            (row) =>
                row.Level === 'platform' && //
                !userPermissions.map((a) => a.Resource).includes(row.Code)
        ),
        // Filter environment permissions
        ...availablePermissions.filter(
            (row) =>
                row.Level !== 'platform' &&
                !userPermissions
                    .filter((a) => a.ResourceID === globalEnvironmentId)
                    .map((a) => a.Resource)
                    .includes(row.Code)
        ),
    ];
}
