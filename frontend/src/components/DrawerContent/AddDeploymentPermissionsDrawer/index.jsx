import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Autocomplete, Box, Button, Checkbox, FormControlLabel, FormGroup, TextField, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGetAccessGroups } from '../../../graphql/permissions/getAccessGroups.js';
import { useGetUsersFromEnvironment } from '../../../graphql/environments/getUsersFromEnvironment.js';
import { useDeploymentPermissionsToUser } from '../../../graphql/permissions/deploymentPermissionsToUser.js';
import { useDeploymentPermissionsToAccessGroup } from '../../../graphql/permissions/deploymentPermissionsToAccessGroup.js';
import { useGlobalEnvironmentState } from '../../EnviromentDropdown';
import { useGlobalMeState } from '../../Navbar';

export const DEFAULT_OPTIONS = {
    view: false,
    run: false,
    assign_permissions: false,
};

const AddDeploymentPermissionsDrawer = ({ handleClose, subjectsWithPermissions, typeToAdd, refreshPermissions, selectedSubject }) => {
    const [selectedTypeToAdd, setSelectedTypeToAdd] = useState(typeToAdd);

    // Global state
    const Environment = useGlobalEnvironmentState();
    const MeData = useGlobalMeState();

    // Control state
    const [clear, setClear] = useState(1);

    // Local state
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [accessGroups, setAccessGroups] = useState([]);
    const [selectedAccessGroup, setSelectedAccessGroup] = useState(null);

    // Options state
    const [permissionsState, setPermissionsState] = useState({ ...DEFAULT_OPTIONS });

    // Custom GraphQL hooks
    const getUsers = useGetUsersHook(Environment.id.get(), setUsers, subjectsWithPermissions);
    const getAccessGroups = useGetAccessGroupsHook(setAccessGroups, Environment.id.get(), MeData.user_id.get(), subjectsWithPermissions);
    const deploymentPermissionsToUser = useDeploymentPermissionsToUserHook(permissionsState, refreshPermissions, handleClose);
    const deploymentPermissionsToAccessGroup = useDeploymentPermissionsToAccessGroupHook(permissionsState, refreshPermissions, handleClose);

    // Get all users and access groups on load
    useEffect(() => {
        getUsers();
        getAccessGroups();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Set input default value
    useEffect(() => {
        if (selectedSubject.first_name && selectedSubject.email) {
            setSelectedUser(selectedSubject);
        } else if (selectedSubject.first_name && !selectedSubject.email) {
            setSelectedAccessGroup({ AccessGroupID: selectedSubject.user_id, Name: selectedSubject.first_name });
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleOptionsChange(event) {
        setPermissionsState({
            ...permissionsState,
            [event.target.name]: event.target.checked,
        });
    }

    function clearOptions() {
        setPermissionsState({ ...DEFAULT_OPTIONS });
    }

    return (
        <Box position="relative">
            <Box sx={{ p: '4.125rem' }}>
                <Box position="absolute" top="26px" right="39px" display="flex" alignItems="center">
                    <Button variant="text" onClick={handleClose} style={{ paddingLeft: '16px', paddingRight: '16px' }} startIcon={<FontAwesomeIcon icon={faTimes} />}>
                        Close
                    </Button>
                </Box>

                <Box width="212px">
                    <Typography component="h2" variant="h2">
                        Add permissions
                    </Typography>

                    <Box mt={1.5} ml={-2} mb={2}>
                        <Button
                            onClick={() => {
                                setSelectedTypeToAdd('User');
                                clearOptions();
                                setSelectedUser(null);
                                setClear(clear * -1);
                            }}
                            sx={{ fontWeight: 400, fontSize: '1.0625rem' }}>
                            User
                        </Button>
                        <Button
                            onClick={() => {
                                setSelectedTypeToAdd('Access group');
                                clearOptions();
                                setSelectedAccessGroup(null);
                                setClear(clear * -1);
                            }}
                            sx={{ fontWeight: 400, fontSize: '1.0625rem', marginLeft: 1 }}>
                            Access group
                        </Button>
                    </Box>

                    {selectedTypeToAdd === 'User' ? (
                        <Autocomplete
                            key={clear} //Changing this value on submit clears the input field
                            onChange={(event, newValue) => {
                                setSelectedUser(newValue);
                            }}
                            onInputChange={(e, v, reason) => {
                                if (reason === 'clear') {
                                    clearOptions();
                                    setClear(clear * -1);
                                }
                            }}
                            value={selectedUser}
                            options={users}
                            getOptionLabel={(option) => option.first_name + ' ' + option.last_name + ' - ' + option.email || ''}
                            isOptionEqualToValue={(option, value) =>
                                option.user_id === value.user_id && //
                                option.first_name === value.first_name &&
                                option.last_name === value.last_name &&
                                option.email === value.email
                            }
                            renderInput={(params) => <TextField {...params} label="User" size="small" sx={{ fontSize: '.75rem', display: 'flex', width: '300px' }} />}
                        />
                    ) : (
                        <Autocomplete
                            key={clear} //Changing this value on submit clears the input field
                            onChange={(event, newValue) => {
                                setSelectedAccessGroup(newValue);
                            }}
                            onInputChange={(e, v, reason) => {
                                if (reason === 'clear') {
                                    clearOptions();
                                    setClear(clear * -1);
                                }
                            }}
                            value={selectedAccessGroup}
                            options={accessGroups}
                            getOptionLabel={(option) => option.Name || option.first_name}
                            isOptionEqualToValue={(option, value) =>
                                option.Name === (value.first_name || value.Name) && //
                                option.AccessGroupID === (value.AccessGroupID || value.user_id)
                            }
                            renderInput={(params) => <TextField {...params} label="Access group" size="small" sx={{ fontSize: '.75rem', display: 'flex' }} />}
                        />
                    )}

                    <FormGroup sx={{ mt: 2 }}>
                        <FormControlLabel
                            control={<Checkbox sx={{ color: 'cyan.main' }} checked={permissionsState.view} name="view" onChange={handleOptionsChange} />}
                            label="View"
                        />
                        <FormControlLabel control={<Checkbox sx={{ color: 'cyan.main' }} checked={permissionsState.run} name="run" onChange={handleOptionsChange} />} label="Run" />
                        <FormControlLabel
                            control={
                                <Checkbox sx={{ color: 'cyan.main' }} checked={permissionsState.assign_permissions} name="assign_permissions" onChange={handleOptionsChange} />
                            }
                            label="Assign permissions"
                        />
                    </FormGroup>

                    <Button
                        onClick={() => {
                            selectedTypeToAdd === 'User'
                                ? deploymentPermissionsToUser(Environment.id.get(), selectedUser.user_id)
                                : deploymentPermissionsToAccessGroup(Environment.id.get(), selectedAccessGroup.AccessGroupID);
                        }}
                        variant="contained"
                        color="primary"
                        style={{ width: '100%' }}
                        sx={{ mt: 2 }}>
                        Save
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default AddDeploymentPermissionsDrawer;

// ----------- Custom Hooks --------------------------------
const useGetUsersHook = (environmentID, setUsers, subjectsWithPermissions) => {
    // GraphQL hook
    const getUsers = useGetUsersFromEnvironment();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get members
    return async () => {
        const response = await getUsers({environment_id: environmentID});

        if (response === null) {
            setUsers([]);
        } else if (response.r || response.error) {
            closeSnackbar();
            enqueueSnackbar("Can't get members: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            // Don't add users that are already on the table
            // setUsers(response.filter((a) => !subjectsWithPermissions.includes(a.user_id)));
            setUsers(response);
        }
    };
};

const useGetAccessGroupsHook = (setAccessGroups, environmentID, userID, subjectsWithPermissions) => {
    // GraphQL hook
    const getAccessGroups = useGetAccessGroups();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get access groups
    return async () => {
        const response = await getAccessGroups({ environmentID, userID });

        if (response.r || response.error) {
            closeSnackbar();
            enqueueSnackbar("Can't get access groups: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            // Don't add access groups that are already on the table
            setAccessGroups(response.filter((a) => !subjectsWithPermissions.includes(a.AccessGroupID)));
        }
    };
};

// Update deployment permissions to user
const useDeploymentPermissionsToUserHook = (permissionsState, refreshPermissions, handleClose) => {
    // GraphQL hook
    const deploymentPermissionsToUser = useDeploymentPermissionsToUser();

    // URI parameter
    const { deploymentId } = useParams();

    const accessDictionary = {
        view: 'read',
        run: 'run',
        assign_permissions: 'assign_deployment_permission',
    };

    const { enqueueSnackbar } = useSnackbar();

    // Make an array of selected permissions. Ex, ==> ["read", "write"]
    const accessArray = Object.keys(permissionsState).filter((a) => permissionsState[a] === true);

    // Update permissions
    return async (environmentID, user_id) => {
        const response = await deploymentPermissionsToUser({
            environmentID,
            resourceID: deploymentId,
            user_id,
            access: accessArray.map((a) => accessDictionary[a]),
        });
        if (response.r || response.error) {
            enqueueSnackbar("Can't update permissions: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            refreshPermissions();
            handleClose();
        }
    };
};

// ----- Access group
// Update deployment permissions to user
const useDeploymentPermissionsToAccessGroupHook = (permissionsState, refreshPermissions, handleClose) => {
    // GraphQL hook
    const deploymentPermissionsToAccessGroup = useDeploymentPermissionsToAccessGroup();

    // URI parameter
    const { deploymentId } = useParams();

    const accessDictionary = {
        view: 'read',
        run: 'run',
        assign_permissions: 'assign_deployment_permission',
    };

    const { enqueueSnackbar } = useSnackbar();

    // Make an array of selected permissions. Ex, ==> ["read", "write"]
    const accessArray = Object.keys(permissionsState).filter((a) => permissionsState[a] === true);

    // Update permissions
    return async (environmentID, access_group_id) => {
        const response = await deploymentPermissionsToAccessGroup({
            environmentID,
            resourceID: deploymentId,
            access_group_id,
            access: accessArray.map((a) => accessDictionary[a]),
        });
        if (response.r || response.error) {
            enqueueSnackbar("Can't update permissions: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            refreshPermissions();
            handleClose();
        }
    };
};
