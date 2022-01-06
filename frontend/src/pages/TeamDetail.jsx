import { Box, Grid, Typography, Chip, Avatar, IconButton, Button, TextField, Drawer, Autocomplete } from '@mui/material';
import { useEffect, useState } from 'react';
import Search from '../components/Search';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { belongToAcessGroupsItems, belongToEnvironmentItems, environmentPermissions, expecificPermissionsItems, platformItems } from '../utils/teamsMockData';
import CustomChip from '../components/CustomChip';
import ChangePasswordDrawer from '../components/DrawerContent/ChangePasswordDrawer';
import DeleteUserDrawer from '../components/DrawerContent/DeleteUserDrawer';
import DeactivateUserDrawer from '../components/DrawerContent/DeactivateUserDrawer';
import { useHistory, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useGetUser } from '../graphql/getUser';
import { useAvailablePermissions } from '../graphql/availablePermissions';
import { useSnackbar } from 'notistack';
import { useUpdateUser } from '../graphql/updateUser';
import ct from 'countries-and-timezones';

const drawerWidth = 507;
const drawerStyles = {
    width: drawerWidth,
    flexShrink: 0,
    zIndex: 9998,
    [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
};

const TeamDetail = () => {
    let history = useHistory();

    // React hook form
    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm();

    // User state
    const [user, setUser] = useState({});
    const [availablePermissions, setAvailablePermissions] = useState([]);
    const [selectedPermission, setSelectedPermission] = useState(null);

    // Sidebar states
    const [isOpenChangePassword, setIsOpenPassword] = useState(false);
    const [isOpenDeleteUser, setIsOpenDeleteUser] = useState(false);
    const [isOpenDeactivateUser, setIsOpenDeactivateUser] = useState(false);

    // Get user data custom hook
    const getData = useGetData(setUser, reset);

    // Get user data custom hook
    const getAvailablePermissions = useGetAvailablePermissions(setAvailablePermissions, reset);

    // Get user data on load
    useEffect(() => {
        getData();
        getAvailablePermissions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Submit user data
    const onSubmit = useSubmitData(user.user_id);

    return (
        <>
            <Box className="page" width="83%">
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
                            {user.email ? (
                                <Button
                                    onClick={() => setIsOpenDeactivateUser(true)}
                                    size="small"
                                    variant="outlined"
                                    color={user.status === 'active' ? 'error' : 'success'}
                                    sx={{ fontWeight: '700', width: '100%', mt: '.78rem', fontSize: '.81rem', border: 2, '&:hover': { border: 2 } }}>
                                    {user.status === 'active' ? 'Deactivate' : 'Activate'} user
                                </Button>
                            ) : null}
                            <Button
                                onClick={() => setIsOpenDeleteUser(true)}
                                size="small"
                                variant="outlined"
                                color="error"
                                sx={{ fontWeight: '700', width: '100%', mt: '.78rem', fontSize: '.81rem', border: 2, '&:hover': { border: 2 } }}>
                                Delete user
                            </Button>

                            <Typography color="rgba(248, 0, 0, 1)" lineHeight="15.23px" sx={{ mt: '.56rem' }} variant="subtitle2">
                                Warning: this action can’t be undone. It is usually better to deactivate a user.
                            </Typography>
                        </Box>
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
                                    onChange={(event, newValue) => {
                                        setSelectedPermission(newValue);
                                    }}
                                    sx={{ minWidth: '280px' }}
                                    options={availablePermissions}
                                    getOptionLabel={(option) => option.Label}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Available permissions" id="available_permissions" size="small" sx={{ fontSize: '.75rem', display: 'flex' }} />
                                    )}
                                />

                                <Button variant="contained" color="primary" height="100%" sx={{ ml: 1 }}>
                                    Add
                                </Button>
                            </Grid>

                            <Box mt={4}>
                                <Typography component="h3" variant="h3" color="text.primary">
                                    Platform
                                </Typography>
                            </Box>

                            <Box mt={2}>
                                {platformItems.map((plat) => (
                                    <Grid display="flex" alignItems="center" key={plat.id} mt={1.5} mb={1.5}>
                                        <Box component={FontAwesomeIcon} sx={{ fontSize: '17px', mr: '7px', color: 'rgba(248, 0, 0, 1)' }} icon={faTrashAlt} />
                                        <Typography variant="subtitle2" lineHeight="15.23px">
                                            {plat.name}
                                        </Typography>
                                    </Grid>
                                ))}
                            </Box>
                            <Box mt="2.31rem">
                                <Typography component="h3" variant="h3" color="text.primary">
                                    Environment permissions
                                </Typography>
                                <Typography variant="subtitle2" mt=".20rem">
                                    Environment: Production
                                </Typography>

                                <Box mt={2}>
                                    {environmentPermissions.map((env) => (
                                        <Grid display="flex" alignItems="center" key={env.id} mt={1.5} mb={1.5}>
                                            <Box component={FontAwesomeIcon} sx={{ fontSize: '17px', mr: '7px', color: 'rgba(248, 0, 0, 1)' }} icon={faTrashAlt} />
                                            <Typography variant="subtitle2" lineHeight="15.23px">
                                                {env.name}
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
                            <Search placeholder="Find access groups" onChange={() => null} />
                            <Button variant="contained" color="primary" height="100%" sx={{ ml: 1 }}>
                                Add
                            </Button>
                        </Grid>

                        <Box mt="1.31rem">
                            {belongToEnvironmentItems.map((env) => (
                                <Grid display="flex" alignItems="center" key={env.id} mt={1.5} mb={1.5}>
                                    <Box component={FontAwesomeIcon} sx={{ fontSize: '17px', mr: '7px', color: 'rgba(248, 0, 0, 1)' }} icon={faTrashAlt} />
                                    <Typography variant="subtitle2" lineHeight="15.23px" color="primary" fontWeight="900">
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
                                <Search placeholder="Find access groups" onChange={() => null} />
                                <Button variant="contained" color="primary" height="100%" sx={{ ml: 1 }}>
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
                                        <Typography variant="subtitle2" lineHeight="15.23px" color="primary" fontWeight="900">
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
                <DeactivateUserDrawer user={user} handleClose={() => setIsOpenDeactivateUser(false)} refreshData={getData} />
            </Drawer>

            <Drawer anchor="right" open={isOpenDeleteUser} onClose={() => setIsOpenDeleteUser(!isOpenDeleteUser)} sx={drawerStyles}>
                <DeleteUserDrawer user={user} handleClose={() => setIsOpenDeleteUser(false)} refreshData={getData} />
            </Drawer>
        </>
    );
};

export default TeamDetail;

// --------- Custom hooks

const useGetData = (setUser, reset) => {
    // GraphQL hook
    const getUser = useGetUser();

    // URI parameter
    const { teamId } = useParams();

    // Get user data
    return async () => {
        const user = await getUser({ user_id: teamId });

        if (user?.r !== 'error') {
            setUser(user);

            // Reset form default values to incoming user data
            reset({
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                job_title: user.job_title,
                timezone: user.timezone,
            });
        }
    };
};

const useSubmitData = (userId) => {
    // GraphQL hook
    const updateUser = useUpdateUser();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Update user info
    return async function onSubmit(data) {
        const allData = {
            input: {
                user_id: userId,
                first_name: data.first_name,
                last_name: data.last_name,
                email: data.email,
                job_title: data.job_title,
                timezone: data.timezone,
            },
        };

        let response = await updateUser(allData);
        if (response === 'success') {
            closeSnackbar();
            enqueueSnackbar(`Success`, { variant: 'success' });
        } else {
            if (response.errors) {
                response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
            }
            if (response.r === 'error') {
                enqueueSnackbar(response.msg, { variant: 'error' });
            }
        }
    };
};

const useGetAvailablePermissions = (setAvailablePermissions, reset) => {
    // GraphQL hook
    const getAvailablePermissions = useAvailablePermissions();

    // Get available permissions
    return async () => {
        const permissions = await getAvailablePermissions();

        if (permissions?.r !== 'error') {
            setAvailablePermissions(permissions);

            // Reset form default values to incoming user data
            // reset({
            //     first_name: user.first_name,
            //     last_name: user.last_name,
            //     email: user.email,
            //     job_title: user.job_title,
            //     timezone: user.timezone,
            // });
        }
    };
};
