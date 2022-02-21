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

const AddPipelinesPermissionDrawer = ({ handleClose, typeToAdd, refreshPermissions }) => {
    const [selectedTypeToAdd, setSelectedTypeToAdd] = useState(typeToAdd);

    // Global state
    const Environment = useGlobalEnvironmentState();
    const MeData = useGlobalMeState();

    // Control state
    const [clear, setClear] = useState(1);

    // Local state
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState([]);
    const [accessGroups, setAccessGroups] = useState([]);
    const [selectedAccessGroup, setSelectedAccessGroup] = useState([]);

    // Options state
    const [incomingPermissionsState, setIncomingPermissionsState] = useState({ ...DEFAULT_OPTIONS });
    const [outgoingPermissionsState, setOutgoingPermissionsState] = useState({ ...DEFAULT_OPTIONS });

    // Custom GraphQL hooks
    const getUsers = useGetUsers_(setUsers);
    const getAccessGroups = useGetAccessGroups_(setAccessGroups, Environment.id.get(), MeData.user_id.get());
    const pipelinePermissionsToUser = usePipelinePermissionsToUser_(incomingPermissionsState, outgoingPermissionsState, setIncomingPermissionsState, refreshPermissions);
    const pipelinePermissionsToAccessGroup = usePipelinePermissionsToAccessGroup_(
        incomingPermissionsState,
        outgoingPermissionsState,
        setIncomingPermissionsState,
        refreshPermissions
    );
    const getUserPipelinePermissions = useGetUserSinglePipelinePermissions_(Environment.id.get(), setIncomingPermissionsState, setOutgoingPermissionsState);

    // Get members on load
    useEffect(() => {
        getUsers();
        getAccessGroups();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleOptionsChange(event) {
        setOutgoingPermissionsState({
            ...outgoingPermissionsState,
            [event.target.name]: event.target.checked,
        });
    }

    function clearStates() {
        setIncomingPermissionsState({ ...DEFAULT_OPTIONS });
        setOutgoingPermissionsState({ ...DEFAULT_OPTIONS });
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
                                clearStates();
                                setSelectedUser([]);
                                setClear(clear * -1);
                            }}
                            sx={{ fontWeight: 400, fontSize: '1.0625rem' }}>
                            User
                        </Button>
                        <Button
                            onClick={() => {
                                setSelectedTypeToAdd('Access group');
                                clearStates();
                                setSelectedUser([]);
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
                                getUserPipelinePermissions(newValue.user_id, clearStates);
                            }}
                            onInputChange={(e, v, reason) => {
                                if (reason === 'clear') {
                                    clearStates();
                                    setClear(clear * -1);
                                }
                            }}
                            options={users}
                            getOptionLabel={(option) => option.first_name + ' ' + option.last_name}
                            renderInput={(params) => <TextField {...params} label="User" size="small" sx={{ fontSize: '.75rem', display: 'flex' }} />}
                        />
                    ) : (
                        <Autocomplete
                            key={clear} //Changing this value on submit clears the input field
                            onChange={(event, newValue) => {
                                setSelectedAccessGroup(newValue);
                                getUserPipelinePermissions(newValue.AccessGroupID, clearStates);
                            }}
                            onInputChange={(e, v, reason) => {
                                if (reason === 'clear') {
                                    clearStates();
                                    setClear(clear * -1);
                                }
                            }}
                            options={accessGroups}
                            getOptionLabel={(option) => option.Name || ''}
                            renderInput={(params) => <TextField {...params} label="Access group" size="small" sx={{ fontSize: '.75rem', display: 'flex' }} />}
                        />
                    )}

                    <FormGroup sx={{ mt: 2 }}>
                        <FormControlLabel
                            control={<Checkbox sx={{ color: 'cyan.main' }} checked={outgoingPermissionsState.view} name="view" onChange={handleOptionsChange} />}
                            label="View"
                        />
                        <FormControlLabel
                            control={<Checkbox sx={{ color: 'cyan.main' }} checked={outgoingPermissionsState.edit} name="edit" onChange={handleOptionsChange} />}
                            label="Edit"
                        />
                        <FormControlLabel
                            control={<Checkbox sx={{ color: 'cyan.main' }} checked={outgoingPermissionsState.run} name="run" onChange={handleOptionsChange} />}
                            label="Run"
                        />
                        <FormControlLabel
                            control={<Checkbox sx={{ color: 'cyan.main' }} checked={outgoingPermissionsState.deploy} name="deploy" onChange={handleOptionsChange} />}
                            label="Deploy"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    sx={{ color: 'cyan.main' }}
                                    checked={outgoingPermissionsState.assign_permissions}
                                    name="assign_permissions"
                                    onChange={handleOptionsChange}
                                />
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

const usePipelinePermissionsToUser_ = (incomingPermissionsState, outgoingPermissionsState, setIncomingPermissionsState, refreshPermissions) => {
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

    const changedPermissions = getDiff(incomingPermissionsState, outgoingPermissionsState);

    // Update permissions
    return async (environmentID, user_id) => {
        for (const access of Object.keys(changedPermissions)) {
            const response = await pipelinePermissionsToUser({
                environmentID,
                resource: 'specific_pipeline',
                resourceID: pipelineId,
                user_id,
                access: accessDictionary[access],
                checked: changedPermissions[access] ? 'yes' : 'no',
            });
            if (response.r === 'error') {
                enqueueSnackbar("Can't update permissions: " + response.msg, {
                    variant: 'error',
                });
            } else if (response.errors) {
                response.errors.map((err) => enqueueSnackbar(err.message + ': update permissions', { variant: 'error' }));
            } else {
                enqueueSnackbar('Success', { variant: 'success' });
                setIncomingPermissionsState(outgoingPermissionsState);
                refreshPermissions();
            }
        }
    };
};

const useGetUserSinglePipelinePermissions_ = (environmentID, setIncomingPermissionsState, setOutgoingPermissionsState) => {
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
    return async (userID, clearStates) => {
        const response = await getUserSinglePipelinePermissions({ userID, environmentID, pipelineID: pipelineId });

        if (response === null) {
            clearStates();
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

            setIncomingPermissionsState({ ...DEFAULT_OPTIONS, ...incomingPermissions });
            setOutgoingPermissionsState({ ...DEFAULT_OPTIONS, ...incomingPermissions });
        }
    };
};

// ----- Access group

const usePipelinePermissionsToAccessGroup_ = (incomingPermissionsState, outgoingPermissionsState, setIncomingPermissionsState, refreshPermissions) => {
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

    const changedPermissions = getDiff(incomingPermissionsState, outgoingPermissionsState);

    // Update permissions
    return async (environmentID, access_group_id) => {
        for (const access of Object.keys(changedPermissions)) {
            const response = await pipelinePermissionsToAccessGroup({
                environmentID,
                resource: 'specific_pipeline',
                resourceID: pipelineId,
                access_group_id,
                access: accessDictionary[access],
                checked: changedPermissions[access] ? 'yes' : 'no',
            });
            if (response.r === 'error') {
                enqueueSnackbar("Can't update permissions: " + response.msg, {
                    variant: 'error',
                });
            } else if (response.errors) {
                response.errors.map((err) => enqueueSnackbar(err.message + ': update permissions', { variant: 'error' }));
            } else {
                enqueueSnackbar('Success', { variant: 'success' });
                setIncomingPermissionsState(outgoingPermissionsState);
                refreshPermissions();
            }
        }
    };
};

// ----- Utility function
/**
 * Takes two permission objects, returns the difference
 * @example
 * incoming = { view: false, edit: false, run: false, assign_permissions: false }
 * outgoing = { view: true,  edit: false, run: false, assign_permissions: false }
 * returns ==> { view: true }
 */
function getDiff(incoming, outgoing) {
    const change = {};
    Object.keys(incoming).map((key) => outgoing[key] !== incoming[key] && (change[key] = outgoing[key]));
    return change;
}
