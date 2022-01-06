import { Box, Grid, Typography, Chip, Avatar, IconButton, Button, TextField, Drawer, Autocomplete } from '@mui/material';
import { useEffect, useState } from 'react';
import Search from '../components/Search';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { belongToAcessGroupsItems, belongToEnvironmentItems, environmentPermissions, expecificPermissionsItems, platformItems } from '../utils/teamsMockData';
import CustomChip from '../components/CustomChip';
import ChangePasswordDrawer from '../components/DrawerContent/ChangePasswordDrawer';
import DeleteUserDrawer from '../components/DrawerContent/DeleteUserDrawer';
import { useHistory } from 'react-router-dom';
import { useMe } from '../graphql/me';
import { useUpdateMe } from '../graphql/updateMe';

import ct from 'countries-and-timezones';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';

const drawerWidth = 507;
const drawerStyles = {
    width: drawerWidth,
    flexShrink: 0,
    zIndex: 9998,
    [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
};

const MemberDetail = () => {
    // Router
    let history = useHistory();

    // React Hook form
    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm();

    // Member states
    const [user, setUser] = useState({});
    const [isActive, setIsActive] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    // Sidebar states
    const [isOpenChangePassword, setIsOpenPassword] = useState(false);
    const [isOpenDeleteUser, setIsOpenDeleteUser] = useState(false);

    // Get me data on load
    useGetData(setUser, reset, setIsActive, setIsAdmin);

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

                            <Box mt={2}>
                                {platformItems.map((plat) => (
                                    <Grid display="flex" alignItems="center" key={plat.id} mt={1.5} mb={1.5}>
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

                        <Box mt="1.31rem">
                            {belongToEnvironmentItems.map((env) => (
                                <Grid display="flex" alignItems="center" key={env.id} mt={1.5} mb={1.5}>
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

                            <Box mt="1.31rem">
                                {belongToAcessGroupsItems.map((env) => (
                                    <Grid
                                        sx={{ cursor: 'pointer', pt: 1.5, pb: 1.5, borderRadius: 2, '&:hover': { background: 'rgba(196, 196, 196, 0.15)' } }}
                                        display="flex"
                                        alignItems="center"
                                        key={env.id}
                                        onClick={() => history.push(`/teams/access/${env.name}`)}>
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

            <Drawer anchor="right" open={isOpenDeleteUser} onClose={() => setIsOpenDeleteUser(!isOpenDeleteUser)} sx={drawerStyles}>
                <DeleteUserDrawer user="Saul Frank" handleClose={() => setIsOpenDeleteUser(false)} />
            </Drawer>
        </>
    );
};

export default MemberDetail;

// --------- Custom hooks

const useGetData = (setUser, reset, setIsActive, setIsAdmin) => {
    const getMe = useMe();
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get me data on load
    useEffect(() => {
        (async () => {
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
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
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
