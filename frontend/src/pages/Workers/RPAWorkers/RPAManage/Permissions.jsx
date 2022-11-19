import { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Autocomplete, TextField } from '@mui/material';
import { useSnackbar } from 'notistack';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { useParams } from 'react-router-dom';
// import { useGlobalEnvironmentState } from '../../components/EnviromentDropdown';
// import { useUpdatePermissionToAccessGroup } from '../../graphql/updatePermissionToAccessGroup';
// import { useAvailablePermissions } from '../../graphql/availablePermissions';
// import { useGetUserPermissions } from '../../graphql/getUserPermissions';
// import { useDeletePermissionToUser } from '../../graphql/deletePermissionToUser';
// import { useGetUserPipelinePermissions } from '../../graphql/getUserPipelinePermissions';
// import { useDeleteSpecificPermission } from '../../graphql/deleteSpecificPermission';
// import { useGetUserDeploymentPermissions } from '../../graphql/getUserDeploymentPermissions';
// import { formatSpecialPermission } from '../../utils/formatString';

export default function Environments({ environmentId }) {
    // Global environment state with hookstate
    // const Environment = useGlobalEnvironmentState();

    // User states
    const [availablePermissions, setAvailablePermissions] = useState([]);
    const [selectedPermission, setSelectedPermission] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [specificPermissions, setSpecificPermissions] = useState([]);

    // Control states
    const [clear, setClear] = useState(1);
    const [firstRender, setFirstRender] = useState(true);

    // Custom GraphQL hooks
    // const getAvailablePermissions = useGetAvailablePermissions(setAvailablePermissions, Environment.id.get());
    // const getPermissions = useGetPermissions(setPermissions, Environment.id.get());
    // const updatePermission = useUpdatePermissions(getPermissions, selectedPermission, environmentId);
    // const getUserPipelinePermissions = useGetUserPipelinePermissionsHook(setSpecificPermissions, Environment.id.get());
    // const deletePermission = useDeletePermission(getPermissions);
    // const deleteSpecificPermission = useDeleteSpecificPermissionHook(getUserPipelinePermissions);

    // Get permissions on load
    useEffect(() => {
        // Get permissions and availablePermissions when environment is retrieved on load
        if ('Environment.id.get()' && firstRender) {
            // getPermissions();
            // getAvailablePermissions();
            // getUserPipelinePermissions();
            // setFirstRender(false);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, ['Environment']);

    return (
        <Box>
            <Typography component="h3" variant="h3" color="text.primary">
                Environments
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
                    // options={filterPermissionsDropdown(availablePermissions, permissions, environmentId)}
                    getOptionLabel={(option) => option.Label}
                    renderInput={(params) => <TextField {...params} label="Environments" id="rpa_environments" size="small" sx={{ fontSize: '.75rem', display: 'flex' }} />}
                />

                <Button
                    onClick={() => {
                        // updatePermission();
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
                                        // onClick={() => deletePermission(env)}
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
                                    // onClick={() => deleteSpecificPermission(permission)}
                                    component={FontAwesomeIcon}
                                    sx={{ fontSize: '17px', mr: '7px', color: 'rgba(248, 0, 0, 1)', cursor: 'pointer' }}
                                    icon={faTrashAlt}
                                />
                                <Typography variant="subtitle2" lineHeight="15.23px" pr={2}>
                                    {/* {formatSpecialPermission(permission)} */}
                                </Typography>
                            </Grid>
                        ))}
                    </Box>
                </Box>
            ) : null}
        </Box>
    );
}
