import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Autocomplete, Box, Button, Checkbox, FormControlLabel, FormGroup, TextField, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGetAccessGroups } from '../../../graphql/getAccessGroups';
import { useGetUsers } from '../../../graphql/getUsers';
import { usePipelinePermissionsToUser } from '../../../graphql/pipelinePermissionsToUser';
import { usePipelinePermissionsToAccessGroup } from '../../../graphql/pipelinePermissionsToAccessGroup';
import { useGetUserSinglePipelinePermissions } from '../../../graphql/getUserSinglePipelinePermissions';
import { useGlobalEnvironmentState } from '../../EnviromentDropdown';
import { useGlobalMeState } from '../../Navbar';

const DEFAULT_OPTIONS = {
    view: false,
    edit: false,
    run: false,
    deploy: false,
    assign_permissions: false,
};

const AddPipelinesPermissionDrawer = ({ handleClose, typeToAdd, refreshPermissions, selectedSubject }) => {
    const [selectedTypeToAdd, setSelectedTypeToAdd] = useState(typeToAdd);

    // Global state
    const Environment = useGlobalEnvironmentState();
    const MeData = useGlobalMeState();

    // Control state
    const [clear, setClear] = useState(1);

    // Local state
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(selectedSubject);
    const [accessGroups, setAccessGroups] = useState([]);
    const [selectedAccessGroup, setSelectedAccessGroup] = useState({ ...selectedSubject, AccessGroupID: selectedSubject.user_id });

    // Options state
    const [permissionsState, setPermissionsState] = useState({ ...DEFAULT_OPTIONS });

    // Custom GraphQL hooks
    const getUsers = useGetUsers_(setUsers);
    const getAccessGroups = useGetAccessGroups_(setAccessGroups, Environment.id.get(), MeData.user_id.get());
    const pipelinePermissionsToUser = usePipelinePermissionsToUser_(permissionsState, refreshPermissions);
    const pipelinePermissionsToAccessGroup = usePipelinePermissionsToAccessGroup_(permissionsState, refreshPermissions);
    const getUserPipelinePermissions = useGetUserSinglePipelinePermissions_(Environment.id.get(), setPermissionsState);

    // Get members on load
    useEffect(() => {
        getUsers();
        getAccessGroups();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Get default user or access groups's permissions on drawer open.
    useEffect(() => {
        getUserPipelinePermissions(selectedSubject.user_id, clearOptions);

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
                                newValue && getUserPipelinePermissions(newValue.user_id, clearOptions);
                            }}
                            onInputChange={(e, v, reason) => {
                                if (reason === 'clear') {
                                    clearOptions();
                                    setClear(clear * -1);
                                }
                            }}
                            value={selectedUser}
                            options={users}
                            getOptionLabel={(option) => option.first_name + ' ' + option.last_name || ''}
                            isOptionEqualToValue={(option, value) =>
                                option.user_id === value.user_id && //
                                option.first_name === value.first_name &&
                                option.last_name === value.last_name &&
                                option.email === value.email
                            }
                            renderInput={(params) => <TextField {...params} label="User" size="small" sx={{ fontSize: '.75rem', display: 'flex' }} />}
                        />
                    ) : (
                        <Autocomplete
                            key={clear} //Changing this value on submit clears the input field
                            onChange={(event, newValue) => {
                                setSelectedAccessGroup(newValue);
                                newValue && getUserPipelinePermissions(newValue.AccessGroupID, clearOptions);
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
                        <FormControlLabel
                            control={<Checkbox sx={{ color: 'cyan.main' }} checked={permissionsState.edit} name="edit" onChange={handleOptionsChange} />}
                            label="Edit"
                        />
                        <FormControlLabel control={<Checkbox sx={{ color: 'cyan.main' }} checked={permissionsState.run} name="run" onChange={handleOptionsChange} />} label="Run" />
                        <FormControlLabel
                            control={<Checkbox sx={{ color: 'cyan.main' }} checked={permissionsState.deploy} name="deploy" onChange={handleOptionsChange} />}
                            label="Deploy"
                        />
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
                                ? pipelinePermissionsToUser(Environment.id.get(), selectedUser.user_id)
                                : pipelinePermissionsToAccessGroup(Environment.id.get(), selectedAccessGroup.AccessGroupID);
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

export default AddPipelinesPermissionDrawer;

// ----------- Custom Hooks --------------------------------
const useGetUsers_ = (setUsers) => {
    // GraphQL hook
    const getUsers = useGetUsers();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get members
    return async () => {
        const response = await getUsers();

        if (response === null) {
            setUsers([]);
        } else if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get members: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': get members', { variant: 'error' }));
        } else {
            setUsers(response);
        }
    };
};

const useGetAccessGroups_ = (setAccessGroups, environmentID, userID) => {
    // GraphQL hook
    const getAccessGroups = useGetAccessGroups();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get access groups
    return async () => {
        const response = await getAccessGroups({ environmentID, userID });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get access groups: " + response.msg, {
                variant: 'error',
            });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': get access groups failed', { variant: 'error' }));
        } else {
            setAccessGroups(response);
        }
    };
};

// Update pipeline permissions to user
const usePipelinePermissionsToUser_ = (permissionsState, refreshPermissions) => {
    // GraphQL hook
    const pipelinePermissionsToUser = usePipelinePermissionsToUser();

    // URI parameter
    const { pipelineId } = useParams();

    const accessDictionary = {
        view: 'read',
        edit: 'write',
        run: 'run',
        deploy: 'deploy',
        assign_permissions: 'assign_pipeline_permission',
    };

    const { enqueueSnackbar } = useSnackbar();

    // Make an array of selected permissions. Ex, ==> ["read", "write"]
    const accessArray = Object.keys(permissionsState).filter((a) => permissionsState[a] === true);

    // Update permissions
    return async (environmentID, user_id) => {
        const response = await pipelinePermissionsToUser({
            environmentID,
            resourceID: pipelineId,
            user_id,
            access: accessArray.map((a) => accessDictionary[a]),
        });
        if (response.r === 'error') {
            enqueueSnackbar("Can't update permissions: " + response.msg, {
                variant: 'error',
            });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': update permissions', { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            refreshPermissions();
        }
    };
};

// Get pipeline permissions to user or access group
const useGetUserSinglePipelinePermissions_ = (environmentID, setpermissionsState) => {
    // GraphQL hook
    const getUserSinglePipelinePermissions = useGetUserSinglePipelinePermissions();

    // URI parameter
    const { pipelineId } = useParams();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const accessDictionary = {
        read: 'view',
        write: 'edit',
        run: 'run',
        deploy: 'deploy',
        assign_pipeline_permission: 'assign_permissions',
    };

    // Get permissions
    return async (userID, clearOptions) => {
        const response = await getUserSinglePipelinePermissions({ userID, environmentID, pipelineID: pipelineId });

        if (response === null) {
            clearOptions();
        } else if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get permissions: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': get permissions', { variant: 'error' }));
        } else {
            // Create an array with access permissions
            const accessArr = response.Access.split(',');

            // Create an object and add Access types that are set to true. Pass it to state
            const incomingPermissions = {};
            accessArr.map((a) => (incomingPermissions[accessDictionary[a]] = true));

            setpermissionsState({ ...DEFAULT_OPTIONS, ...incomingPermissions });
        }
    };
};

// ----- Access group
// Update pipeline permissions to user
const usePipelinePermissionsToAccessGroup_ = (permissionsState, refreshPermissions) => {
    // GraphQL hook
    const pipelinePermissionsToAccessGroup = usePipelinePermissionsToAccessGroup();

    // URI parameter
    const { pipelineId } = useParams();

    const accessDictionary = {
        view: 'read',
        edit: 'write',
        run: 'run',
        deploy: 'deploy',
        assign_permissions: 'assign_pipeline_permission',
    };

    const { enqueueSnackbar } = useSnackbar();

    // Make an array of selected permissions. Ex, ==> ["read", "write"]
    const accessArray = Object.keys(permissionsState).filter((a) => permissionsState[a] === true);

    // Update permissions
    return async (environmentID, access_group_id) => {
        const response = await pipelinePermissionsToAccessGroup({
            environmentID,
            resourceID: pipelineId,
            access_group_id,
            access: accessArray.map((a) => accessDictionary[a]),
        });
        if (response.r === 'error') {
            enqueueSnackbar("Can't update permissions: " + response.msg, {
                variant: 'error',
            });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': update permissions', { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            refreshPermissions();
        }
    };
};
