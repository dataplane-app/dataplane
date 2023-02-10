import { Box, Grid, Typography, Button, TextField, Autocomplete, Drawer } from '@mui/material';
import ct from 'countries-and-timezones';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import ChangeMyPasswordDrawer from '../../components/DrawerContent/ChangeMyPasswordDrawer';
import { useGlobalMeState } from '../../components/Navbar';
import { useUpdateMe } from '../../graphql/updateMe';

export default function LeftColumn() {
    // Global Me state
    const MeData = useGlobalMeState();

    // Sidebar states
    const [isOpenChangePassword, setIsOpenPassword] = useState(false);

    // React Hook form
    const { register, handleSubmit } = useForm({
        defaultValues: {
            first_name: MeData.first_name.get(),
            last_name: MeData.last_name.get(),
            email: MeData.email.get(),
            job_title: MeData.job_title.get(),
            timezone: MeData.timezone.get(),
        },
    });

    return (
        <Grid item minWidth="250px" width="250px" mb={2}>
            <Typography component="h3" variant="h3" color="text.primary">
                Details
            </Typography>

            <form onSubmit={handleSubmit(useSubmitData())}>
                <Box mt={2} display="grid" flexDirection="row">
                    <TextField label="First name" id="first_name" size="small" required sx={{ mb: '.45rem' }} {...register('first_name', { required: true })} />

                    <TextField label="Last name" id="last_name" size="small" required sx={{ margin: '.45rem 0' }} {...register('last_name', { required: true })} />

                    <TextField label="Email" type="email" id="email" size="small" required sx={{ margin: '.45rem 0' }} {...register('email', { required: true })} />

                    <TextField label="Job title" id="job_title" size="small" required sx={{ margin: '.45rem 0' }} {...register('job_title', { required: true })} />

                    <Autocomplete
                        disablePortal
                        defaultValue={MeData.timezone.get()}
                        id="combo-box-demo"
                        options={Object.keys(ct.getAllTimezones())}
                        renderInput={(params) => (
                            <TextField {...params} label="Timezone" id="timezone" size="small" sx={{ mt: 2, fontSize: '.75rem', display: 'flex' }} {...register('timezone')} />
                        )}
                    />

                    <Button type="submit" variant="contained" color="primary" sx={{ width: '100%', mt: '1rem' }}>
                        Save
                    </Button>
                </Box>
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

            <Drawer anchor="right" open={isOpenChangePassword} onClose={() => setIsOpenPassword(!isOpenChangePassword)}>
                <ChangeMyPasswordDrawer handleClose={() => setIsOpenPassword(false)} />
            </Drawer>
        </Grid>
    );
}

// Custom hooks
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

        if (response.r || response.error) {
            closeSnackbar();
            enqueueSnackbar("Can't update user data: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            closeSnackbar();
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            closeSnackbar();
            enqueueSnackbar(`Success`, { variant: 'success' });
        }
    };
};
