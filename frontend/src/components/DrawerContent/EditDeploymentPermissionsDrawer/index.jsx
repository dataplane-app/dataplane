import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Autocomplete, Box, Button, Checkbox, FormControlLabel, FormGroup, TextField, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGetAccessGroups } from '../../../graphql/getAccessGroups';
import { useGetUsers } from '../../../graphql/getUsers';
import { useDeploymentPermissionsToUser } from '../../../graphql/deploymentPermissionsToUser';
import { useDeploymentPermissionsToAccessGroup } from '../../../graphql/deploymentPermissionsToAccessGroup';
import { useGetUserSingleDeploymentPermissions } from '../../../graphql/getUserSingleDeploymentPermissions';
import { useGlobalEnvironmentState } from '../../EnviromentDropdown';
import { useGlobalMeState } from '../../Navbar';

export const DEFAULT_OPTIONS = {
    view: false,
    run: false,
    assign_permissions: false,
};

const EditDeploymentPermissionsDrawer = ({ handleClose, refreshPermissions, selectedSubject }) => {
    // Global state
    const Environment = useGlobalEnvironmentState();

    // Local state
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedAccessGroup, setSelectedAccessGroup] = useState(null);

    // Options state
    const [permissionsState, setPermissionsState] = useState({ ...DEFAULT_OPTIONS });

    // Custom GraphQL hooks
    const deploymentPermissionsToUser = useDeploymentPermissionsToUserHook(permissionsState, refreshPermissions, handleClose);
    const deploymentPermissionsToAccessGroup = useDeploymentPermissionsToAccessGroupHook(permissionsState, refreshPermissions, handleClose);
    const getUserDeploymentPermissions = useGetUserSingleDeploymentPermissionsHook(Environment.id.get(), setPermissionsState, selectedSubject.type);

    // Set input default value
    useEffect(() => {
        if (selectedSubject.first_name && selectedSubject.email) {
            setSelectedUser(selectedSubject);
        } else if (selectedSubject.first_name && !selectedSubject.email) {
            setSelectedAccessGroup({ AccessGroupID: selectedSubject.user_id, Name: selectedSubject.first_name });
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Get default user or access groups's permissions on drawer open.
    useEffect(() => {
        getUserDeploymentPermissions(selectedSubject.user_id, clearOptions);

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
                        Edit permissions
                    </Typography>

                    <Typography width="150%" mt={2}>
                        {selectedSubject.type === 'user' ? 'User' : 'Access group'}: {selectedSubject.first_name + ' ' + selectedSubject.last_name}
                    </Typography>

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
                            selectedSubject.type === 'user'
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

export default EditDeploymentPermissionsDrawer;

// ----------- Custom Hooks --------------------------------
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

// Get deployment permissions to user or access group
const useGetUserSingleDeploymentPermissionsHook = (environmentID, setpermissionsState, type) => {
    // GraphQL hook
    const getUserSingleDeploymentPermissions = useGetUserSingleDeploymentPermissions();

    // URI parameter
    const { deploymentId } = useParams();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const accessDictionary = {
        read: 'view',
        run: 'run',
        assign_deployment_permission: 'assign_permissions',
    };

    // Get permissions
    return async (userID, clearOptions) => {
        const response = await getUserSingleDeploymentPermissions({ userID, environmentID, deploymentID: deploymentId, subjectType: type });

        if (response === null) {
            clearOptions();
        } else if (response.r || response.error) {
            closeSnackbar();
            enqueueSnackbar("Can't get permissions: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            // Create an array with access permissions
            const accessArr = response.Access.split(',').filter((a) => a === 'read' || a === 'run' || a === 'assign_deployment_permission');

            // Create an object and add Access types that are set to true. Pass it to state
            const incomingPermissions = {};
            accessArr.map((a) => (incomingPermissions[accessDictionary[a]] = true));

            setpermissionsState({ ...DEFAULT_OPTIONS, ...incomingPermissions });
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
