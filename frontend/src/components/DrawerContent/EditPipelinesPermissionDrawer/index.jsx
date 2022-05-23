import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, Checkbox, FormControlLabel, FormGroup, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePipelinePermissionsToUser } from '../../../graphql/pipelinePermissionsToUser';
import { usePipelinePermissionsToAccessGroup } from '../../../graphql/pipelinePermissionsToAccessGroup';
import { useGetUserSinglePipelinePermissions } from '../../../graphql/getUserSinglePipelinePermissions';
import { useGlobalEnvironmentState } from '../../EnviromentDropdown';

export const DEFAULT_OPTIONS = {
    view: false,
    edit: false,
    run: false,
    deploy: false,
    assign_permissions: false,
};

const EditPipelinesPermissionDrawer = ({ handleClose, refreshPermissions, selectedSubject }) => {
    // Global state
    const Environment = useGlobalEnvironmentState();

    // Local state
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedAccessGroup, setSelectedAccessGroup] = useState(null);

    // Options state
    const [permissionsState, setPermissionsState] = useState({ ...DEFAULT_OPTIONS });

    // Custom GraphQL hooks
    const pipelinePermissionsToUser = usePipelinePermissionsToUserHook(permissionsState, refreshPermissions, handleClose);
    const pipelinePermissionsToAccessGroup = usePipelinePermissionsToAccessGroupHook(permissionsState, refreshPermissions, handleClose);
    const getUserPipelinePermissions = useGetUserSinglePipelinePermissionsHook(Environment.id.get(), setPermissionsState, selectedSubject.type);

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
                            selectedSubject.type === 'user'
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

export default EditPipelinesPermissionDrawer;

// ----------- Custom Hooks --------------------------------
// Update pipeline permissions to user
const usePipelinePermissionsToUserHook = (permissionsState, refreshPermissions, handleClose) => {
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

// Get pipeline permissions to user or access group
const useGetUserSinglePipelinePermissionsHook = (environmentID, setpermissionsState, type) => {
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
        const response = await getUserSinglePipelinePermissions({ userID, environmentID, pipelineID: pipelineId, subjectType: type });

        if (response === null) {
            clearOptions();
        } else if (response.r || response.error) {
            closeSnackbar();
            enqueueSnackbar("Can't get permissions: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
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
const usePipelinePermissionsToAccessGroupHook = (permissionsState, refreshPermissions, handleClose) => {
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
        if (response.r || response.error) {
            enqueueSnackbar("Can't update permissions: " + (response.msg || response.r || response.error), {
                variant: 'error',
            });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            refreshPermissions();
            handleClose();
        }
    };
};
