import { Box, Grid, Typography, Chip, Avatar, IconButton, Button, TextField, Drawer, Autocomplete } from '@mui/material';
import { useEffect, useState, useRef, useContext } from 'react';
import Search from '../components/Search';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { belongToAcessGroupsItems, expecificPermissionsItems } from '../utils/teamsMockData';
import CustomChip from '../components/CustomChip';
import ChangePasswordDrawer from '../components/DrawerContent/ChangePasswordDrawer';
import DeleteUserDrawer from '../components/DrawerContent/DeleteUserDrawer';
import DeactivateUserDrawer from '../components/DrawerContent/DeactivateUserDrawer';
import { useHistory, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
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
import { useCreateAccessGroup } from '../graphql/createAccessGroup';
import { useGetAccessGroups } from '../graphql/getAccessGroups';
import { EnvironmentContext } from '../App';

const drawerWidth = 507;
const drawerStyles = {
    width: drawerWidth,
    flexShrink: 0,
    zIndex: 9998,
    [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
};

export default function TeamDetail() {
    // Context
    const [globalEnvironment] = useContext(EnvironmentContext);

    // React router
    let history = useHistory();

    // Ref for scroll to top
    const scrollRef = useRef(null);

    // React hook form
    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm();

    // User states
    const [user, setUser] = useState({});
    const [meData, setMeData] = useState({});
    const [availableEnvironments, setAvailableEnvironments] = useState([]);
    const [userEnvironments, setUserEnvironments] = useState([]);
    const [selectedUserEnvironment, setSelectedUserEnvironment] = useState(null);
    const [availablePermissions, setAvailablePermissions] = useState([]);
    const [selectedPermission, setSelectedPermission] = useState(null);
    const [userPermissions, setUserPermissions] = useState([]);
    const [accessGroup, setAccessGroup] = useState('');
    const [accessGroups, setAccessGroups] = useState([]);
    const [userAccessGroups, setUserAccessGroups] = useState([]);
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
    const updatePermission = useUpdatePermissions(getUserPermissions, selectedPermission, globalEnvironment?.id, user.user_id);
    const deletePermission = useDeletePermission(getUserPermissions);
    const createAccessGroup = useCreateAccessGroup_(globalEnvironment?.id);
    const getAccessGroups = useGetAccessGroups_(setAccessGroups, globalEnvironment?.id, user.user_id);

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

        // // Get access groups the user belongs when user environment and id are available and if empty
        // if (globalEnvironment && user && userAccessGroups.length === 0) {
        //     //
        // }

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
                                    // Filter out users permissions from available permissions
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
                                    }}
                                    variant="contained"
                                    color="primary"
                                    height="100%"
                                    sx={{ ml: 1 }}>
                                    Add
                                </Button>
                            </Grid>

                            <Box mt={4}>
                                <Typography component="h3" variant="h3" color="text.primary">
                                    Platform
                                </Typography>
                            </Box>

                            <Box mt={2}>
                                {userPermissions
                                    .filter((plat) => plat.Resource.includes('platform'))
                                    .map((plat) => (
                                        <Grid display="flex" alignItems="center" key={plat.Label} mt={1.5} mb={1.5}>
                                            <Box
                                                onClick={() => !(user.user_id === meData.user_id && plat.Label === 'Admin') && deletePermission(plat)}
                                                component={FontAwesomeIcon}
                                                sx={{
                                                    fontSize: '17px',
                                                    mr: '7px',
                                                    color: user.user_id === meData.user_id && plat.Label === 'Admin' ? 'rgba(0, 0, 0, 0.26)' : 'rgba(248, 0, 0, 1)',
                                                    cursor: !(user.user_id === meData.user_id && plat.Label === 'Admin') && 'pointer',
                                                }}
                                                icon={faTrashAlt}
                                            />
                                            <Typography variant="subtitle2" lineHeight="15.23px">
                                                {plat.Label}
                                            </Typography>
                                        </Grid>
                                    ))}
                            </Box>
                            <Box mt="2.31rem">
                                <Typography component="h3" variant="h3" color="text.primary">
                                    Environment permissions
                                </Typography>
                                <Typography variant="subtitle2" mt=".20rem">
                                    Environment: {globalEnvironment?.name}
                                </Typography>

                                <Box mt={2}>
                                    {userPermissions
                                        .filter((env) => !env.Resource.includes('platform') && env.EnvironmentID === globalEnvironment.id)
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

                            <Box mt="3.5rem">
                                <Typography component="h3" variant="h3" color="text.primary">
                                    Specific permissions
                                </Typography>
                                <Typography variant="subtitle2" mt=".20rem">
                                    Environment: Production
                                </Typography>

                                <Box mt={2}>
                                    {expecificPermissionsItems.map((exp) => (
                                        <Grid display="flex" alignItems="center" key={exp.id} mt={1.5} mb={1.5}>
                                            <Box component={FontAwesomeIcon} sx={{ fontSize: '17px', mr: '7px', color: 'rgba(248, 0, 0, 1)' }} icon={faTrashAlt} />
                                            <Typography variant="subtitle2" lineHeight="15.23px">
                                                {exp.name}
                                            </Typography>
                                        </Grid>
                                    ))}
                                </Box>
                            </Box>
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
                                // options={availableEnvironments}
                                getOptionLabel={(option) => option.name}
                                renderInput={(params) => (
                                    <TextField {...params} label="Available environments" id="available_environments" size="small" sx={{ fontSize: '.75rem', display: 'flex' }} />
                                )}
                            />
                            <Button
                                onClick={() => {
                                    addUserToEnv(user.user_id, selectedUserEnvironment.id);
                                    setClear(clear * -1);
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
                                    <Typography variant="subtitle2" lineHeight="15.23px" color="primary">
                                        {env.name}
                                    </Typography>
                                </Grid>
                            ))}
                        </Box>

                        <Box mt="2.31rem">
                            <Typography component="h3" variant="h3" color="text.primary">
                                Belongs to access groups
                            </Typography>

                            <Grid mt={2} display="flex" alignItems="center">
                                {/* <Search placeholder="Find access groups" /> */}
                                <Autocomplete
                                    disablePortal
                                    id="available_access_groups"
                                    key={clear} //Changing this value on submit clears the input field
                                    onChange={(e) => setAccessGroup(e.target.value)}
                                    sx={{ minWidth: '280px' }}
                                    // Filter out available access groups from the ones user belongs
                                    // options={availableEnvironments.filter((row) => !userEnvironments.map((a) => a.id).includes(row.id)) || ''}
                                    options={accessGroups}
                                    getOptionLabel={(option) => option.Name}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Find access groups" id="access_groups" size="small" sx={{ fontSize: '.75rem', display: 'flex' }} />
                                    )}
                                />
                                <Button
                                    // onClick={() => createAccessGroup(accessGroup)}
                                    variant="contained"
                                    color="primary"
                                    height="100%"
                                    sx={{ ml: 1 }}>
                                    Add
                                </Button>
                            </Grid>

                            <Box mt="1.31rem">
                                {belongToAcessGroupsItems.map((env) => (
                                    <Grid
                                        sx={{ cursor: 'pointer', pt: 1.5, pb: 1.5, borderRadius: 2, '&:hover': { background: 'rgba(196, 196, 196, 0.15)' } }}
                                        display="flex"
                                        alignItems="center"
                                        key={env.id}
                                        onClick={() => history.push(`/teams/access/${env.name}`)}>
                                        <Box component={FontAwesomeIcon} sx={{ fontSize: '17px', mr: '7px', color: 'rgba(248, 0, 0, 1)' }} icon={faTrashAlt} />
                                        <Typography variant="subtitle2" lineHeight="15.23px" color="primary">
                                            {env.name}
                                        </Typography>
                                    </Grid>
                                ))}
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </Box>

            <Drawer anchor="right" open={isOpenChangePassword} onClose={() => setIsOpenPassword(!isOpenChangePassword)} sx={drawerStyles}>
                <ChangePasswordDrawer handleClose={() => setIsOpenPassword(false)} />
            </Drawer>

            <Drawer anchor="right" open={isOpenDeactivateUser} onClose={() => setIsOpenDeactivateUser(!isOpenDeactivateUser)} sx={drawerStyles}>
                <DeactivateUserDrawer user={user} handleClose={() => setIsOpenDeactivateUser(false)} refreshData={getUserData} />
            </Drawer>

            <Drawer anchor="right" open={isOpenDeleteUser} onClose={() => setIsOpenDeleteUser(!isOpenDeleteUser)} sx={drawerStyles}>
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
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
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
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
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
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
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
            enqueueSnackbar("Can't get me data: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setAvailableEnvironments(response);
        }
    };
};

const useGetUserEnvironments_ = (setUserEnvironments, user_id, environment_id) => {
    // GraphQL hook
    const getUserEnvironments = useGetUserEnvironments();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get environments on load
    return async () => {
        const response = await getUserEnvironments({ user_id, environment_id });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get me data: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setUserEnvironments(response);
        }
    };
};

const useRemoveUserFromEnv = (getUserEnvironments) => {
    // GraphQL hook
    const removeUserFromEnvironment = useRemoveUserFromEnvironment();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get environments on load
    return async (user_id, environment_id) => {
        const response = await removeUserFromEnvironment({ user_id, environment_id });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get me data: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
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

    // Get environments on load
    return async (user_id, environment_id) => {
        const response = await addUserToEnvironment({ user_id, environment_id });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get me data: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
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
            enqueueSnackbar("Can't get permissions: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
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
                enqueueSnackbar("Can't user permissions: " + response.msg, { variant: 'error' });
            } else if (response.errors) {
                response.errors.map((err) => enqueueSnackbar(err.message + ': get user permissions', { variant: 'error' }));
            } else {
                setUserPermissions(response);
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
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
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
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getUserPermissions();
        }
    };
};

const useCreateAccessGroup_ = (environmentID) => {
    // GraphQL hook
    const createAccessGroup = useCreateAccessGroup();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Create access group
    return async (name) => {
        const response = await createAccessGroup({ environmentID });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't delete permission: " + response.msg, {
                variant: 'error',
            });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
        }
    };
};

const useGetAccessGroups_ = (setAccessGroups, environmentID, userID) => {
    // GraphQL hook
    const getAccessGroups = useGetAccessGroups();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Create access group
    return async () => {
        const response = await getAccessGroups({ environmentID, userID });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't delete permission: " + response.msg, {
                variant: 'error',
            });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setAccessGroups(response);
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
