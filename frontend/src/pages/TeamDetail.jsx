import { Box, Grid, Typography, Button, TextField, Drawer, Autocomplete } from '@mui/material';
import { useEffect, useState, useRef, useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import CustomChip from '../components/CustomChip';
import ChangePasswordDrawer from '../components/DrawerContent/ChangePasswordDrawer';
import DeleteUserDrawer from '../components/DrawerContent/DeleteUserDrawer';
import DeactivateUserDrawer from '../components/DrawerContent/DeactivateUserDrawer';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { useHistory } from 'react-router-dom';
import ct from 'countries-and-timezones';
import { useGetUser } from '../graphql/getUser';
import { useAvailablePermissions } from '../graphql/availablePermissions';
import { useUpdateUser } from '../graphql/updateUser';
import { useMe } from '../graphql/me';

import { useGetUserPermissions } from '../graphql/getUserPermissions';
import { useUpdatePermissionToUser } from '../graphql/updatePermissionToUser';
import { useDeletePermissionToUser } from '../graphql/deletePermissionToUser';
import { useGetEnvironments } from '../graphql/getEnvironments';
import { useGetUserEnvironments } from '../graphql/getUserEnvironments';
import { useRemoveUserFromEnvironment } from '../graphql/removeUserToEnvironment';
import { useAddUserToEnvironment } from '../graphql/addUserToEnvironment';
import { useGetAccessGroups } from '../graphql/getAccessGroups';
import { useUpdateUserToAccessGroup } from '../graphql/updateUserToAccessGroup';
import { useGetUserAccessGroups } from '../graphql/getUserAccessGroups';
import { useRemoveUserFromAccessGroup } from '../graphql/removeUserFromAccessGroup';
import { useGetUserPipelinePermissions } from '../graphql/getUserPipelinePermissions';
import { EnvironmentContext } from '../App';

export default function TeamDetail() {
    // Context
    const [globalEnvironment] = useContext(EnvironmentContext);

    // Ref for scroll to top
    const scrollRef = useRef(null);

    // React hook form
    const { register, handleSubmit, reset } = useForm();

    // Router
    let history = useHistory();

    // User states
    const [user, setUser] = useState({});
    const [meData, setMeData] = useState({});
    const [availableEnvironments, setAvailableEnvironments] = useState([]);
    const [userEnvironments, setUserEnvironments] = useState([]);
    const [selectedUserEnvironment, setSelectedUserEnvironment] = useState(null);
    const [availablePermissions, setAvailablePermissions] = useState([]);
    const [selectedPermission, setSelectedPermission] = useState(null);
    const [userPermissions, setUserPermissions] = useState([]);
    const [specificPermissions, setSpecificPermissions] = useState([]);
    const [accessGroup, setAccessGroup] = useState('');
    const [accessGroups, setAccessGroups] = useState([]);
    const [userAccessGroups, setUserAccessGroups] = useState([]);

    // Control state
    const [clear, setClear] = useState(1);

    // Sidebar states
    const [isOpenChangePassword, setIsOpenPassword] = useState(false);
    const [isOpenDeleteUser, setIsOpenDeleteUser] = useState(false);
    const [isOpenDeactivateUser, setIsOpenDeactivateUser] = useState(false);

    // Custom GraphQL hooks
    const getMeData = useGetMeData(setMeData);
    const getUserData = useGetUserData(setUser, reset);
    const getEnvironments = useGetEnvironmentsData(setAvailableEnvironments);
    const getUserEnvironments = useGetUserEnvironments_(setUserEnvironments, user.user_id, globalEnvironment?.id);
    const removeUserFromEnv = useRemoveUserFromEnv(getUserEnvironments);
    const addUserToEnv = useAddUserToEnv(getUserEnvironments);
    const getAvailablePermissions = useGetAvailablePermissions(setAvailablePermissions, globalEnvironment?.id);
    const getUserPermissions = useGetUserPermissions_(setUserPermissions, user.user_id, globalEnvironment?.id);
    const getUserPipelinePermissions = useGetUserPipelinePermissions_(setSpecificPermissions, user.user_id, globalEnvironment?.id);
    const updatePermission = useUpdatePermissions(getUserPermissions, selectedPermission, globalEnvironment?.id, user.user_id);
    const deletePermission = useDeletePermission(getUserPermissions);
    const getAccessGroups = useGetAccessGroups_(setAccessGroups, globalEnvironment?.id, user.user_id);
    const getUserAccessGroups = useGetUserAccessGroups_(setUserAccessGroups, globalEnvironment?.id, user.user_id);
    const updateUserToAccessGroup = useUpdateUserToAccessGroup_(globalEnvironment?.id, user.user_id, getUserAccessGroups, accessGroup);
    const removeUserFromAccessGroup = useRemoveUserFromAccessGroup_(getUserAccessGroups);

    // Get user data on load
    useEffect(() => {
        // Scroll to top on load
        scrollRef.current.parentElement.scrollIntoView();

        getMeData();
        getUserData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        // Get user permissions when user environment and id are available and if empty
        if (globalEnvironment && user && userPermissions.length === 0) {
            getUserPermissions();
        }

        // Get all available permissions when user environment and id are available and if empty
        if (globalEnvironment && user) {
            getAvailablePermissions();
            getUserPipelinePermissions();
        }

        // Get all available environments when user environment and id are available and if empty
        if (globalEnvironment && user.user_id && userEnvironments.length === 0) {
            getUserEnvironments();
        }

        // Get environments the user belongs when user environment and id are available and if empty
        if (globalEnvironment && user && availableEnvironments.length === 0) {
            getEnvironments();
        }

        // Get all access groups when environment and id are available and if empty
        if (globalEnvironment && user.user_id && accessGroups.length === 0) {
            getAccessGroups();
        }

        // Get access groups the user belongs when user environment and id are available and if empty
        if (globalEnvironment && user.user_id && userAccessGroups.length === 0) {
            getUserAccessGroups();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [globalEnvironment?.id, user.user_id]);

    useEffect(() => {
        // Update available permissions' ResourceIDs on environment change
        setAvailablePermissions(
            availablePermissions.map(({ a, ...permission }) => ({ ...permission, ResourceID: permission.Level === 'environment' ? globalEnvironment.id : permission.ResourceID }))
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [globalEnvironment?.id]);

    // Submit user details
    const onSubmit = useSubmitData(user.user_id);

    return (
        <>
            <Box className="page" width="83%" ref={scrollRef}>
                <Grid container alignItems="center">
                    <Typography component="h2" variant="h2" color="text.primary">
                        Team {' > '} {user.first_name} {user.last_name}
                    </Typography>

                    <Grid item ml={4}>
                        {user.status === 'active' ? <CustomChip label="Active" customColor="green" margin={1} /> : <CustomChip label="Inactive" customColor="red" margin={1} />}
                        {user.user_type === 'admin' ? <CustomChip label="Admin" customColor="orange" /> : null}
                    </Grid>
                </Grid>

                <Grid container mt={5} alignItems="flex-start" justifyContent="space-between">
                    <Grid item sx={{ flex: 1 }}>
                        <Typography component="h3" variant="h3" color="text.primary">
                            Details
                        </Typography>

                        <form onSubmit={handleSubmit(onSubmit)}>
                            {user.email ? (
                                <Box mt={2} display="grid" flexDirection="row">
                                    <TextField label="First name" id="first_name" size="small" required sx={{ mb: '.45rem' }} {...register('first_name', { required: true })} />

                                    <TextField label="Last name" id="last_name" size="small" required sx={{ margin: '.45rem 0' }} {...register('last_name', { required: true })} />

                                    <TextField label="Email" type="email" id="email" size="small" required sx={{ margin: '.45rem 0' }} {...register('email', { required: true })} />

                                    <TextField label="Job title" id="job_title" size="small" required sx={{ margin: '.45rem 0' }} {...register('job_title', { required: true })} />

                                    <Autocomplete
                                        disablePortal
                                        value={user.timezone}
                                        id="combo-box-demo"
                                        onChange={(event, newValue) => {
                                            setUser({ ...user, timezone: newValue });
                                        }}
                                        options={Object.keys(ct.getAllTimezones())}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Timezone"
                                                id="timezone"
                                                size="small"
                                                sx={{ mt: 2, fontSize: '.75rem', display: 'flex' }}
                                                {...register('timezone')}
                                            />
                                        )}
                                    />

                                    <Button type="submit" variant="contained" color="primary" sx={{ width: '100%', mt: '1rem' }}>
                                        Save
                                    </Button>
                                </Box>
                            ) : null}
                        </form>

                        <Box sx={{ margin: '2.45rem 0', borderTop: 1, borderColor: 'divider' }}></Box>

                        {user.email && meData.email ? (
                            <Box>
                                <Typography component="h3" variant="h3" color="text.primary">
                                    Control
                                </Typography>
                                <Button
                                    onClick={() => setIsOpenPassword(true)}
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    sx={{ fontWeight: '700', width: '100%', mt: '.78rem', fontSize: '.81rem', border: 2, '&:hover': { border: 2 } }}>
                                    Change password
                                </Button>
                                <Button
                                    onClick={() => setIsOpenDeactivateUser(true)}
                                    disabled={user.user_id === meData.user_id ? true : false}
                                    size="small"
                                    variant="outlined"
                                    color={user.status === 'active' ? 'error' : 'success'}
                                    sx={{ fontWeight: '700', width: '100%', mt: '.78rem', fontSize: '.81rem', border: 2, '&:hover': { border: 2 } }}>
                                    {user.status === 'active' ? 'Deactivate' : 'Activate'} user
                                </Button>
                                <Button
                                    onClick={() => setIsOpenDeleteUser(true)}
                                    disabled={user.user_id === meData.user_id ? true : false}
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    sx={{ fontWeight: '700', width: '100%', mt: '.78rem', fontSize: '.81rem', border: 2, '&:hover': { border: 2 } }}>
                                    Delete user
                                </Button>
                                {user.user_id !== meData.user_id ? (
                                    <Typography color="rgba(248, 0, 0, 1)" lineHeight="15.23px" sx={{ mt: '.56rem' }} variant="subtitle2">
                                        Warning: this action can't be undone. It is usually better to deactivate a user.
                                    </Typography>
                                ) : null}
                            </Box>
                        ) : null}
                    </Grid>
                    <Grid item sx={{ flex: 2.2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
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
                                    options={filterPermissionsDropdown(availablePermissions, userPermissions, globalEnvironment?.id)}
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

                            {/* Platform permissions */}
                            {/* Check if there are any permissions. If not, hide the box */}
                            {userPermissions.filter((permission) => permission.Level === 'platform').length ? (
                                <Box mt={4}>
                                    <Box>
                                        <Typography component="h3" variant="h3" color="text.primary">
                                            Platform
                                        </Typography>
                                    </Box>

                                    <Box mt={2}>
                                        {userPermissions
                                            .filter((permission) => permission.Level === 'platform')
                                            .map((permission) => (
                                                <Grid display="flex" alignItems="center" key={permission.Label} mt={1.5} mb={1.5}>
                                                    <Box
                                                        onClick={() => !(user.user_id === meData.user_id && permission.Label === 'Admin') && deletePermission(permission)}
                                                        component={FontAwesomeIcon}
                                                        sx={{
                                                            fontSize: '17px',
                                                            mr: '7px',
                                                            color: user.user_id === meData.user_id && permission.Label === 'Admin' ? 'rgba(0, 0, 0, 0.26)' : 'rgba(248, 0, 0, 1)',
                                                            cursor: !(user.user_id === meData.user_id && permission.Label === 'Admin') && 'pointer',
                                                        }}
                                                        icon={faTrashAlt}
                                                    />
                                                    <Typography variant="subtitle2" lineHeight="15.23px">
                                                        {permission.Label}
                                                    </Typography>
                                                </Grid>
                                            ))}
                                    </Box>
                                </Box>
                            ) : null}

                            {/* Environment permissions */}
                            {/* Check if there are any permissions. If not, hide the box */}
                            {userPermissions.filter((permission) => permission.Level === 'environment' && permission.EnvironmentID === globalEnvironment.id).length ? (
                                <Box mt="2.31rem">
                                    <Typography component="h3" variant="h3" color="text.primary">
                                        Environment permissions
                                    </Typography>
                                    <Typography variant="subtitle2" mt=".20rem">
                                        Environment: {globalEnvironment?.name}
                                    </Typography>

                                    <Box mt={2}>
                                        {userPermissions
                                            .filter((permission) => permission.Level === 'environment' && permission.EnvironmentID === globalEnvironment.id)
                                            .map((permission) => (
                                                <Grid display="flex" alignItems="center" key={permission.Label} mt={1.5} mb={1.5}>
                                                    <Box
                                                        onClick={() => deletePermission(permission)}
                                                        component={FontAwesomeIcon}
                                                        sx={{ fontSize: '17px', mr: '7px', color: 'rgba(248, 0, 0, 1)', cursor: 'pointer' }}
                                                        icon={faTrashAlt}
                                                    />
                                                    <Typography variant="subtitle2" lineHeight="15.23px">
                                                        {permission.Label}
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
                                        {specificPermissions
                                            ?.filter((permission) => permission.EnvironmentID === globalEnvironment?.id)
                                            .map((permission) => (
                                                <Grid display="flex" alignItems="center" key={permission.Label} mt={1.5} mb={1.5}>
                                                    <Box
                                                        onClick={() => deletePermission(permission)}
                                                        component={FontAwesomeIcon}
                                                        sx={{ fontSize: '17px', mr: '7px', color: 'rgba(248, 0, 0, 1)', cursor: 'pointer' }}
                                                        icon={faTrashAlt}
                                                    />
                                                    <Typography variant="subtitle2" lineHeight="15.23px">
                                                        Pipeline {permission.PipelineName + ' ' + permission.Access}
                                                    </Typography>
                                                </Grid>
                                            ))}
                                    </Box>
                                </Box>
                            ) : null}
                        </Box>
                    </Grid>
                    <Grid item sx={{ flex: 1 }}>
                        <Typography component="h3" variant="h3" color="text.primary">
                            Belongs to environments
                        </Typography>

                        <Grid mt={2} display="flex" alignItems="center">
                            <Autocomplete
                                disablePortal
                                id="available_permissions_autocomplete"
                                key={clear} //Changing this value on submit clears the input field
                                onChange={(event, newValue) => {
                                    setSelectedUserEnvironment(newValue);
                                }}
                                sx={{ minWidth: '280px' }}
                                // Filter out users permissions from available permissions
                                options={availableEnvironments.filter((row) => !userEnvironments.map((a) => a.id).includes(row.id)) || ''}
                                getOptionLabel={(option) => option.name}
                                renderInput={(params) => (
                                    <TextField {...params} label="Available environments" id="available_environments" size="small" sx={{ fontSize: '.75rem', display: 'flex' }} />
                                )}
                            />
                            <Button
                                onClick={() => {
                                    addUserToEnv(user.user_id, selectedUserEnvironment.id);
                                    setClear(clear * -1);
                                    setSelectedUserEnvironment(null);
                                }}
                                variant="contained"
                                color="primary"
                                height="100%"
                                sx={{ ml: 1 }}>
                                Add
                            </Button>
                        </Grid>

                        <Box mt="1.31rem">
                            {userEnvironments.map((env) => (
                                <Grid display="flex" alignItems="center" key={env.id} mt={1.5} mb={1.5}>
                                    <Box
                                        onClick={() => {
                                            removeUserFromEnv(user.user_id, env.id);
                                        }}
                                        component={FontAwesomeIcon}
                                        sx={{ fontSize: '17px', mr: '7px', color: 'rgba(248, 0, 0, 1)', cursor: 'pointer' }}
                                        icon={faTrashAlt}
                                    />
                                    <Typography
                                        onClick={() => history.push(`/settings/environment/${env.id}`)}
                                        variant="subtitle2"
                                        lineHeight="15.23px"
                                        color="primary"
                                        sx={{ cursor: 'pointer', marginRight: 1 }}>
                                        {env.name}
                                    </Typography>
                                    <CustomChip size="small" label={env.active ? 'Active' : 'Inactive'} customColor={env.active ? 'green' : 'red'} />
                                </Grid>
                            ))}
                        </Box>

                        <Box mt="2.31rem">
                            <Typography component="h3" variant="h3" color="text.primary">
                                Belongs to access groups
                            </Typography>

                            <Grid mt={2} display="flex" alignItems="center">
                                <Autocomplete
                                    disablePortal
                                    id="available_access_groups"
                                    key={clear} //Changing this value on submit clears the input field
                                    onChange={(event, newValue) => {
                                        setAccessGroup(newValue);
                                    }}
                                    sx={{ minWidth: '280px' }}
                                    // Filter out available access groups from the ones user belongs
                                    options={
                                        accessGroups.filter(
                                            (row) => !userAccessGroups.map((a) => a.AccessGroupID).includes(row.AccessGroupID) && row.EnvironmentID === globalEnvironment.id
                                        ) || ''
                                    }
                                    getOptionLabel={(option) => option.Name}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Find access groups" id="access_groups" size="small" sx={{ fontSize: '.75rem', display: 'flex' }} />
                                    )}
                                />
                                <Button
                                    onClick={() => {
                                        updateUserToAccessGroup(accessGroup.AccessGroupID);
                                        setClear(clear * -1); // Clears autocomplete input field
                                        setAccessGroup('');
                                    }}
                                    variant="contained"
                                    color="primary"
                                    height="100%"
                                    sx={{ ml: 1 }}>
                                    Add
                                </Button>
                            </Grid>

                            <Box mt="1.31rem">
                                {userAccessGroups
                                    .filter((row) => row.EnvironmentID === globalEnvironment.id)
                                    .map((row) => (
                                        <Grid display="flex" alignItems="center" key={row.Name} mt={1.5} mb={1.5}>
                                            <Box
                                                onClick={() => {
                                                    removeUserFromAccessGroup(row.AccessGroupID, row.EnvironmentID, row.UserID);
                                                }}
                                                component={FontAwesomeIcon}
                                                sx={{ fontSize: '17px', mr: '7px', color: 'rgba(248, 0, 0, 1)', cursor: 'pointer' }}
                                                icon={faTrashAlt}
                                            />
                                            <Typography
                                                onClick={() => history.push(`/teams/access/${row.AccessGroupID}`)}
                                                variant="subtitle2"
                                                lineHeight="15.23px"
                                                color="primary"
                                                sx={{ cursor: 'pointer', marginRight: 1 }}>
                                                {row.Name}
                                            </Typography>
                                            <CustomChip size="small" label={row.Active ? 'Active' : 'Inactive'} customColor={row.Active ? 'green' : 'red'} />
                                        </Grid>
                                    ))}
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </Box>

            <Drawer anchor="right" open={isOpenChangePassword} onClose={() => setIsOpenPassword(!isOpenChangePassword)}>
                <ChangePasswordDrawer handleClose={() => setIsOpenPassword(false)} />
            </Drawer>

            <Drawer anchor="right" open={isOpenDeactivateUser} onClose={() => setIsOpenDeactivateUser(!isOpenDeactivateUser)}>
                <DeactivateUserDrawer user={user} handleClose={() => setIsOpenDeactivateUser(false)} refreshData={getUserData} />
            </Drawer>

            <Drawer anchor="right" open={isOpenDeleteUser} onClose={() => setIsOpenDeleteUser(!isOpenDeleteUser)}>
                <DeleteUserDrawer user={user} handleClose={() => setIsOpenDeleteUser(false)} refreshData={getUserData} />
            </Drawer>
        </>
    );
}

// --------- Custom hooks ---------- //

const useSubmitData = (userId) => {
    // GraphQL hook
    const updateUser = useUpdateUser();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Update user info
    return async function onSubmit(data) {
        const userDetails = {
            input: {
                user_id: userId,
                first_name: data.first_name,
                last_name: data.last_name,
                email: data.email,
                job_title: data.job_title,
                timezone: data.timezone,
            },
        };

        let response = await updateUser(userDetails);

        if (response.r === 'error') {
            enqueueSnackbar("Can't update user data: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': update user data failed', { variant: 'error' }));
        } else {
            closeSnackbar();
            enqueueSnackbar(`Success`, { variant: 'success' });
        }
    };
};

const useGetMeData = (setMeData) => {
    // GraphQL hook
    const getMe = useMe();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get me data on load
    return async () => {
        const response = await getMe();

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get me data: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': get me data failed', { variant: 'error' }));
        } else {
            setMeData(response);
        }
    };
};

const useGetUserData = (setUser, reset) => {
    // GraphQL hook
    const getUser = useGetUser();

    const { enqueueSnackbar } = useSnackbar();

    // URI parameter
    const { teamId } = useParams();

    // Get user data on load
    return async () => {
        const response = await getUser({ user_id: teamId });

        if (response.r === 'error') {
            enqueueSnackbar("Can't get user data: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': get user data failed', { variant: 'error' }));
        } else {
            setUser(response);

            // Reset form default values to incoming user data
            reset({
                first_name: response.first_name,
                last_name: response.last_name,
                email: response.email,
                job_title: response.job_title,
                timezone: response.timezone,
            });
        }
    };
};

const useGetEnvironmentsData = (setAvailableEnvironments) => {
    // GraphQL hook
    const getEnvironments = useGetEnvironments();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get environments on load
    return async () => {
        const response = await getEnvironments();

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get environments: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': get environments failed', { variant: 'error' }));
        } else {
            setAvailableEnvironments(response);
        }
    };
};

const useGetUserEnvironments_ = (setUserEnvironments, user_id, environment_id) => {
    // GraphQL hook
    const getUserEnvironments = useGetUserEnvironments();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get user environments
    return async () => {
        const response = await getUserEnvironments({ user_id, environment_id });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get user environments: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': get user environments failed', { variant: 'error' }));
        } else {
            setUserEnvironments(response);
        }
    };
};

const useRemoveUserFromEnv = (getUserEnvironments) => {
    // GraphQL hook
    const removeUserFromEnvironment = useRemoveUserFromEnvironment();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Remove user from environment
    return async (user_id, environment_id) => {
        const response = await removeUserFromEnvironment({ user_id, environment_id });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't remove user from environment: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': remove user from environment failed', { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getUserEnvironments();
        }
    };
};

const useAddUserToEnv = (getUserEnvironments) => {
    // GraphQL hook
    const addUserToEnvironment = useAddUserToEnvironment();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Add user to environment
    return async (user_id, environment_id) => {
        const response = await addUserToEnvironment({ user_id, environment_id });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't add user to environment: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': add user to environment failed', { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getUserEnvironments();
        }
    };
};

const useGetAvailablePermissions = (setAvailablePermissions, environmentID) => {
    // GraphQL hooks
    const getAvailablePermissions = useAvailablePermissions();
    // const getOnePreference = useGetOnePreference();

    const { enqueueSnackbar } = useSnackbar();

    return async () => {
        // Get available permissions
        const response = await getAvailablePermissions({ environmentID });

        if (response.r === 'error') {
            enqueueSnackbar("Can't get available permissions: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': get available permissions failed', { variant: 'error' }));
        } else {
            setAvailablePermissions(response);
        }
    };
};

const useGetUserPermissions_ = (setUserPermissions, userID, environmentID) => {
    // GraphQL hook
    const getUserPermissions = useGetUserPermissions();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get user permissions
    return async () => {
        if (userID !== undefined && environmentID !== null) {
            const response = await getUserPermissions({ userID, environmentID });

            if (response === null) {
                setUserPermissions([]);
            } else if (response.r === 'error') {
                closeSnackbar();
                enqueueSnackbar("Can't get user permissions: " + response.msg, { variant: 'error' });
            } else if (response.errors) {
                response.errors.map((err) => enqueueSnackbar(err.message + ': get user permissions failed', { variant: 'error' }));
            } else {
                setUserPermissions(response);
            }
        }
    };
};

const useGetUserPipelinePermissions_ = (setSpecificPermissions, userID, environmentID) => {
    // GraphQL hook
    const getUserPipelinePermissions = useGetUserPipelinePermissions();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get specific permissions
    return async () => {
        if (userID !== undefined && environmentID !== null) {
            const response = await getUserPipelinePermissions({ userID, environmentID });

            if (response === null) {
                setSpecificPermissions([]);
            } else if (response.r === 'error') {
                closeSnackbar();
                enqueueSnackbar("Can't get specific permissions: " + response.msg, { variant: 'error' });
            } else if (response.errors) {
                response.errors.map((err) => enqueueSnackbar(err.message + ': get specific permissions failed', { variant: 'error' }));
            } else {
                setSpecificPermissions(response);
            }
        }
    };
};

const useUpdatePermissions = (getUserPermissions, selectedPermission, environmentID, user_id) => {
    // GraphQL hook
    const updatePermissionToUser = useUpdatePermissionToUser();

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
            user_id,
            access: selectedPermission.Access,
        });
        if (response.r === 'error') {
            enqueueSnackbar("Can't update permissions: " + response.msg, {
                variant: 'error',
            });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': update permissions failed', { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getUserPermissions();
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
            response.errors.map((err) => enqueueSnackbar(err.message + ': delete permission failed', { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getUserPermissions();
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

const useGetUserAccessGroups_ = (setUserAccessGroups, environmentID, userID) => {
    // GraphQL hook
    const getUserAccessGroups = useGetUserAccessGroups();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get user's access groups
    return async () => {
        const response = await getUserAccessGroups({ environmentID, userID });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get user's access groups: " + response.msg, {
                variant: 'error',
            });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ": get user's access groups failed", { variant: 'error' }));
        } else {
            setUserAccessGroups(response);
        }
    };
};

const useUpdateUserToAccessGroup_ = (environmentID, user_id, getUserAccessGroups, accessGroup) => {
    // GraphQL hook
    const updateUserToAccessGroup = useUpdateUserToAccessGroup();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    if (accessGroup === '') return; // If add button is clicked without a selection

    // Add user to group
    return async (access_group_id) => {
        const response = await updateUserToAccessGroup({ environmentID, user_id, access_group_id });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't add user to access group: " + response.msg, {
                variant: 'error',
            });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': add user to access group failed', { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getUserAccessGroups();
        }
    };
};

const useRemoveUserFromAccessGroup_ = (getUserAccessGroups) => {
    // GraphQL hook
    const removeUserFromAccessGroup = useRemoveUserFromAccessGroup();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Remove user from an access group
    return async (access_group_id, environmentID, user_id) => {
        const response = await removeUserFromAccessGroup({ user_id, environmentID, access_group_id });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't remove user: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': remove user from access group failed', { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getUserAccessGroups();
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
                row.Level === 'environment' &&
                !userPermissions
                    .filter((a) => a.ResourceID === globalEnvironmentId)
                    .map((a) => a.Resource)
                    .includes(row.Code)
        ),
    ];
}
