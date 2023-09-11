import { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Autocomplete, TextField } from '@mui/material';
import { useSnackbar } from 'notistack';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { useParams } from 'react-router-dom';
import { useGlobalEnvironmentState } from '../../components/EnviromentDropdown';
import { useUpdatePermissionToAccessGroup } from '../../graphql/permissions/updatePermissionToAccessGroup.js';
import { useAvailablePermissions } from '../../graphql/permissions/availablePermissions.js';
import { useGetUserPermissions } from '../../graphql/permissions/getUserPermissions.js';
import { useDeletePermissionToUser } from '../../graphql/permissions/deletePermissionToUser.js';
import { useGetUserPipelinePermissions } from '../../graphql/permissions/getUserPipelinePermissions.js';
import { useDeleteSpecificPermission } from '../../graphql/permissions/deleteSpecificPermission.js';
import { useGetUserDeploymentPermissions } from '../../graphql/permissions/getUserDeploymentPermissions.js';
import { formatSpecialPermission } from '../../utils/formatString';

export default function Permissions({ environmentId }) {
    // Global environment state with hookstate
    const Environment = useGlobalEnvironmentState();

    // User states
    const [availablePermissions, setAvailablePermissions] = useState([]);
    const [selectedPermission, setSelectedPermission] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [specificPermissions, setSpecificPermissions] = useState([]);

    // Control states
    const [clear, setClear] = useState(1);
    const [firstRender, setFirstRender] = useState(true);

    // Custom GraphQL hooks
    const getAvailablePermissions = useGetAvailablePermissions(setAvailablePermissions, Environment.id.get());
    const getPermissions = useGetPermissions(setPermissions, Environment.id.get());
    const updatePermission = useUpdatePermissions(getPermissions, selectedPermission, environmentId);
    const getUserPipelinePermissions = useGetUserPipelinePermissionsHook(setSpecificPermissions, Environment.id.get());
    const deletePermission = useDeletePermission(getPermissions);
    const deleteSpecificPermission = useDeleteSpecificPermissionHook(getUserPipelinePermissions);

    // Get permissions on load
    useEffect(() => {
        // Get permissions and availablePermissions when environment is retrieved on load
        if (Environment.id.get() && firstRender) {
            getPermissions();
            getAvailablePermissions();
            getUserPipelinePermissions();
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

            {/* Environment permissions */}
            {/* Check if there are any permissions. If not, hide the box */}
            {permissions.filter((env) => env.Level === 'environment').length ? (
                <Box mt="2.31rem">
                    <Typography component="h3" variant="h3" color="text.primary">
                        Environment permissions
                    </Typography>

                    <Box mt={2}>
                        {permissions
                            .filter((permission) => permission.Level === 'environment')
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

            {/* Specific permissions */}
            {/* Check if there are any permissions. If not, hide the box */}
            {specificPermissions.length ? (
                <Box mt={4}>
                    <Box>
                        <Typography component="h3" variant="h3" color="text.primary">
                            Specific permissions
                        </Typography>
                    </Box>

                    <Box mt={2}>
                        {specificPermissions.map((permission) => (
                            <Grid display="flex" alignItems="center" width="200%" key={permission.ResourceID} mt={1.5} mb={1.5}>
                                <Box
                                    onClick={() => deleteSpecificPermission(permission)}
                                    component={FontAwesomeIcon}
                                    sx={{ fontSize: '17px', mr: '7px', color: 'rgba(248, 0, 0, 1)', cursor: 'pointer' }}
                                    icon={faTrashAlt}
                                />
                                <Typography variant="subtitle2" lineHeight="15.23px" pr={2}>
                                    {formatSpecialPermission(permission)}
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
                response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
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
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
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
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
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

        if (response.r || response.error) {
            closeSnackbar();
            enqueueSnackbar("Can't delete permission: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getUserPermissions();
        }
    };
};

const useDeleteSpecificPermissionHook = (getSpecificPermissions) => {
    // GraphQL hook
    const deleteSpecificPermission = useDeleteSpecificPermission();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Delete a permission
    return async (permission) => {
        const subject = 'access_group';
        const subjectID = permission.SubjectID;
        const resourceID = permission.ResourceID;
        const environmentID = permission.EnvironmentID;

        const response = await deleteSpecificPermission({ subject, subjectID, resourceID, environmentID });

        if (response.r || response.error) {
            closeSnackbar();
            enqueueSnackbar("Can't delete permission: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getSpecificPermissions();
        }
    };
};

const useGetUserPipelinePermissionsHook = (setSpecificPermissions, environmentID) => {
    // GraphQL hook
    const getUserPipelinePermissions = useGetUserPipelinePermissions();
    const getUserDeploymentPermissions = useGetUserDeploymentPermissions();

    const { enqueueSnackbar } = useSnackbar();

    // URI parameter
    const { accessId } = useParams();

    // Get specific permissions
    return async () => {
        let responsePipeline = await getUserPipelinePermissions({ userID: accessId, environmentID, subjectType: 'access_group' });

        if (responsePipeline === null) {
            responsePipeline = [];
        } else if (responsePipeline.r || responsePipeline.error) {
            enqueueSnackbar("Can't get specific permissions: " + (responsePipeline.msg || responsePipeline.r || responsePipeline.error), { variant: 'error' });
        } else if (responsePipeline.errors) {
            responsePipeline.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        }

        const responseDeployment = await getUserDeploymentPermissions({ userID: accessId, environmentID, subjectType: 'access_group' });

        if (responseDeployment === null) {
            setSpecificPermissions(responsePipeline);
        } else if (responseDeployment.r || responseDeployment.error) {
            enqueueSnackbar("Can't get specific permissions: " + (responseDeployment.msg || responseDeployment.r || responseDeployment.error), { variant: 'error' });
        } else if (responseDeployment.errors) {
            responseDeployment.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setSpecificPermissions([...responsePipeline, ...responseDeployment]);
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
                permission.Level === 'environment' &&
                !userPermissions
                    .filter((a) => a.ResourceID === globalEnvironmentId)
                    .map((a) => a.Resource)
                    .includes(permission.Code)
        ),
    ];
}
