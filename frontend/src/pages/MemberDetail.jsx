import { Box, Grid, Typography, Button, TextField, Drawer, Autocomplete } from '@mui/material';
import { useEffect, useState, useContext } from 'react';
import CustomChip from '../components/CustomChip';
import ChangePasswordDrawer from '../components/DrawerContent/ChangePasswordDrawer';
import DeleteUserDrawer from '../components/DrawerContent/DeleteUserDrawer';
import { useHistory } from 'react-router-dom';
import { useMe } from '../graphql/me';
import { useUpdateMe } from '../graphql/updateMe';
import { useGetUserPermissions } from '../graphql/getUserPermissions';
import { useGetUserEnvironments } from '../graphql/getUserEnvironments';
import { useGetUserAccessGroups } from '../graphql/getUserAccessGroups';
import { useGetMyPipelinePermissions } from '../graphql/getMyPipelinePermissions';
import { EnvironmentContext } from '../App';
import ct from 'countries-and-timezones';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';

const MemberDetail = () => {
    // Context
    const [globalEnvironment] = useContext(EnvironmentContext);

    // Router
    let history = useHistory();

    // React Hook form
    const { register, handleSubmit, reset } = useForm();

    // Member states
    const [user, setUser] = useState({});
    const [isActive, setIsActive] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userPermissions, setUserPermissions] = useState([]);
    const [userSpecificPermissions, setUserSpecificPermissions] = useState([]);
    const [userEnvironments, setUserEnvironments] = useState([]);
    const [accessGroups, setAccessGroups] = useState([]);

    // Sidebar states
    const [isOpenChangePassword, setIsOpenPassword] = useState(false);
    const [isOpenDeleteUser, setIsOpenDeleteUser] = useState(false);

    // Custom Hooks
    const getData = useGetData(setUser, reset, setIsActive, setIsAdmin);
    const getUserPermissions = useGetUserPermissions_(setUserPermissions, user.user_id, globalEnvironment?.id);
    const getUserEnvironments = useGetUserEnvironments_(setUserEnvironments, user.user_id, globalEnvironment?.id);
    const getAccessGroups = useGetUserAccessGroups_(setAccessGroups, globalEnvironment?.id, user.user_id);
    const getMyPipelinePermissions = useGetMyPipelinePermissions_(setUserSpecificPermissions);

    // Get me data on load
    useEffect(() => {
        getData();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Data to be retrieved after the user data is retrieved
    useEffect(() => {
        if (globalEnvironment?.id && user.user_id) {
            getAccessGroups();
            getUserPermissions();
            getUserEnvironments();
            getMyPipelinePermissions();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [globalEnvironment?.id, user.user_id]);

    // Submit me data
    const onSubmit = useSubmitData();

    return (
        <>
            <Box className="page" width="83%">
                <Grid container alignItems="center">
                    <Typography component="h2" variant="h2" color="text.primary">
                        My Account
                    </Typography>

                    <Grid item ml={4}>
                        {isActive ? <CustomChip label="Active" customColor="green" margin={1} /> : <CustomChip label="Inactive" customColor="red" margin={1} />}
                        {isAdmin && <CustomChip label="Admin" customColor="orange" />}
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
                        </Box>
                    </Grid>
                    <Grid item sx={{ flex: 2.2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                        <Box>
                            <Box>
                                <Typography component="h3" variant="h3" color="text.primary">
                                    Platform permissions
                                </Typography>
                            </Box>

                            {/* Platform permissions */}
                            <Box mt={2}>
                                {userPermissions
                                    ?.filter((permission) => permission.Level === 'platform')
                                    .map((permission) => (
                                        <Grid display="flex" alignItems="center" key={permission.ID} mt={1.5} mb={1.5}>
                                            <Typography variant="subtitle2" lineHeight="15.23px">
                                                {permission.Label}
                                            </Typography>
                                        </Grid>
                                    ))}
                            </Box>

                            {/* Environment permissions */}
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
                                            ?.filter((permission) => permission.Level === 'environment' && permission.ResourceID === globalEnvironment?.id)
                                            .map((permission) => (
                                                <Grid display="flex" alignItems="center" key={permission.ID} mt={1.5} mb={1.5}>
                                                    <Typography variant="subtitle2" lineHeight="15.23px">
                                                        {permission.Label}
                                                    </Typography>
                                                </Grid>
                                            ))}
                                    </Box>
                                </Box>
                            ) : null}

                            {/* Specific permissions */}
                            {userSpecificPermissions.length ? (
                                <Box mt="2.31rem">
                                    <Typography component="h3" variant="h3" color="text.primary">
                                        Specific permissions
                                    </Typography>

                                    <Box mt={2}>
                                        {userSpecificPermissions
                                            ?.filter((permission) => permission.EnvironmentID === globalEnvironment?.id)
                                            .map((permission) => (
                                                <Grid display="flex" alignItems="center" key={permission.ID} mt={1.5} mb={1.5}>
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

                        <Box mt="1.31rem">
                            {userEnvironments.length ? (
                                userEnvironments.map((env) => (
                                    <Grid display="flex" mt={1.5} mb={1.5} alignItems="center" key={env.id}>
                                        <Typography
                                            onClick={() => history.push(`/settings/environment/${env.id}`)}
                                            sx={{ cursor: 'pointer' }}
                                            variant="subtitle2"
                                            lineHeight="15.23px"
                                            color="primary">
                                            {env.name}
                                        </Typography>
                                    </Grid>
                                ))
                            ) : (
                                <Typography variant="subtitle2" lineHeight="15.23px">
                                    None
                                </Typography>
                            )}
                        </Box>

                        <Box mt="2.31rem">
                            <Typography component="h3" variant="h3" color="text.primary">
                                Belongs to access groups
                            </Typography>

                            <Box mt="1.31rem">
                                {accessGroups.filter((env) => env.EnvironmentID === globalEnvironment.id).length ? (
                                    accessGroups
                                        .filter((env) => env.EnvironmentID === globalEnvironment.id)
                                        .map((env) => (
                                            <Grid display="flex" mt={1.5} mb={1.5} alignItems="center" key={env.AccessGroupID}>
                                                <Typography
                                                    onClick={() => history.push(`/teams/access/${env.AccessGroupID}`)}
                                                    sx={{ cursor: 'pointer' }}
                                                    variant="subtitle2"
                                                    lineHeight="15.23px"
                                                    color="primary">
                                                    {env.Name ? env.Name : 'None'}
                                                </Typography>
                                            </Grid>
                                        ))
                                ) : (
                                    <Typography variant="subtitle2" lineHeight="15.23px">
                                        None
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </Box>

            <Drawer anchor="right" open={isOpenChangePassword} onClose={() => setIsOpenPassword(!isOpenChangePassword)}>
                <ChangePasswordDrawer handleClose={() => setIsOpenPassword(false)} />
            </Drawer>

            <Drawer anchor="right" open={isOpenDeleteUser} onClose={() => setIsOpenDeleteUser(!isOpenDeleteUser)}>
                <DeleteUserDrawer user="Saul Frank" handleClose={() => setIsOpenDeleteUser(false)} />
            </Drawer>
        </>
    );
};

export default MemberDetail;

// --------- Custom hooks

const useGetData = (setUser, reset, setIsActive, setIsAdmin) => {
    // GraphQL hook
    const getMe = useMe();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get me data on load
    return async () => {
        const response = await getMe();

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get user data: " + response.msg, {
                variant: 'error',
            });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setUser(response);

            // Reset form default values to incoming me data
            reset({
                first_name: response.first_name,
                last_name: response.last_name,
                email: response.email,
                job_title: response.job_title,
                timezone: response.timezone,
            });

            // Check if user is active
            if (response.status !== 'active') {
                setIsActive(false);
            }

            // Check if user is admin
            if (response.user_type === 'admin') {
                setIsAdmin(true);
            }
        }
    };
};

const useSubmitData = () => {
    const updateMe = useUpdateMe();
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    return async function onSubmit(formData) {
        const allData = {
            input: {
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                job_title: formData.job_title,
                timezone: formData.timezone,
            },
        };

        let response = await updateMe(allData);

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't update user data: " + response.msg, {
                variant: 'error',
            });
        } else if (response.errors) {
            closeSnackbar();
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            closeSnackbar();
            enqueueSnackbar(`Success`, { variant: 'success' });
        }
    };
};

const useGetUserPermissions_ = (setUserPermissions, userID, environmentID) => {
    // GraphQL hook
    const getUserPermissions = useGetUserPermissions();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get user permissions
    return async () => {
        if (userID && environmentID) {
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

const useGetMyPipelinePermissions_ = (setUserSpecificPermissions) => {
    // GraphQL hook
    const getMyPipelinePermissions = useGetMyPipelinePermissions();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get specific permissions
    return async () => {
        const response = await getMyPipelinePermissions();

        if (response === null) {
            setUserSpecificPermissions([]);
        } else if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get specific permissions: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': gets specific permissions', { variant: 'error' }));
        } else {
            setUserSpecificPermissions(response);
        }
    };
};

const useGetUserEnvironments_ = (setUserEnvironments, user_id, environment_id) => {
    // GraphQL hook
    const getUserEnvironments = useGetUserEnvironments();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get environments on load
    return async () => {
        if (user_id && environment_id) {
            const response = await getUserEnvironments({ user_id, environment_id });

            if (response.r === 'error') {
                closeSnackbar();
                enqueueSnackbar("Can't get me data: " + response.msg, { variant: 'error' });
            } else if (response.errors) {
                response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
            } else {
                setUserEnvironments(response);
            }
        }
    };
};

const useGetUserAccessGroups_ = (setAccessGroups, environmentID, userID) => {
    // GraphQL hook
    const getUserAccessGroups = useGetUserAccessGroups();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get access groups
    return async () => {
        const response = await getUserAccessGroups({ environmentID, userID });

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
