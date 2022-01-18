import { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Autocomplete, TextField } from '@mui/material';
import { useSnackbar } from 'notistack';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { useParams } from 'react-router-dom';
import { useGlobalEnvironmentState } from '../../components/EnviromentDropdown';
import { useUpdatePermissionToAccessGroup } from '../../graphql/updatePermissionToAccessGroup';
import { useAvailablePermissions } from '../../graphql/availablePermissions';
import { useGetUserPermissions } from '../../graphql/getUserPermissions';
import { useDeletePermissionToUser } from '../../graphql/deletePermissionToUser';

export default function Permissions({ environmentId }) {
    // Global environment state with hookstate
    const Environment = useGlobalEnvironmentState();

    // User states
    const [availablePermissions, setAvailablePermissions] = useState([]);
    const [selectedPermission, setSelectedPermission] = useState(null);
    const [permissions, setPermissions] = useState([]);

    // Control states
    const [clear, setClear] = useState(1);
    const [firstRender, setFirstRender] = useState(true);

    // Custom GraphQL hooks
    const getAvailablePermissions = useGetAvailablePermissions(setAvailablePermissions, Environment.id.get());
    const getPermissions = useGetPermissions(setPermissions, Environment.id.get());
    const updatePermission = useUpdatePermissions(getPermissions, selectedPermission, environmentId);
    const deletePermission = useDeletePermission(getPermissions);

    // Get permissions on load
    useEffect(() => {
        // Get permissions and availablePermissions when environment is retrieved on load
        if (Environment.id.get() && firstRender) {
            getPermissions();
            getAvailablePermissions();
            setFirstRender(false);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Environment]);

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
                    options={filterPermissionsDropdown(availablePermissions, permissions, environmentId)}
                    getOptionLabel={(option) => option.Label}
                    renderInput={(params) => (
                        <TextField {...params} label="Available permissions" id="available_permissions" size="small" sx={{ fontSize: '.75rem', display: 'flex' }} />
                    )}
                />

                <Button
                    onClick={() => {
                        updatePermission();
                        setClear(clear * -1); // Clears autocomplete input field
                        setSelectedPermission(null);
                    }}
                    variant="contained"
                    color="primary"
                    height="100%"
                    sx={{ ml: 1 }}>
                    Add
                </Button>
            </Grid>

            {/* Check if there are any permissions. If not, hide the box */}
            {permissions.length ? (
                <Box mt="2.31rem">
                    <Typography component="h3" variant="h3" color="text.primary">
                        Environment permissions
                    </Typography>

                    <Box mt={2}>
                        {permissions.map((env) => (
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

    // Update permissions
    return async () => {
        const response = await updatePermissionToUser({
            environmentID,
            resource: selectedPermission.Code,
            resourceID: environmentID,
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
        // Filter environment permissions
        ...availablePermissions.filter(
            (permission) =>
                permission.Level !== 'platform' &&
                !userPermissions
                    .filter((a) => a.ResourceID === globalEnvironmentId)
                    .map((a) => a.Resource)
                    .includes(permission.Code)
        ),
    ];
}
