import { Autocomplete, Box, Button, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useCreateAdmin } from '../../graphql/createAdmin';
import { useSnackbar } from 'notistack';
import ct from 'countries-and-timezones';
import ThemeToggle from '../ThemeToggle';
import PasswordField from '../PasswordField';

const GetStartedForm = ({ handleNext }) => {
    const createAdmin = useCreateAdmin();
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    async function onSubmit(data) {
        const allData = {
            platform: {
                business_name: data.business_name,
                timezone: data.timezone,
                complete: false,
            },
            users: {
                first_name: data.first_name,
                last_name: data.last_name,
                email: data.email,
                job_title: data.job_title,
                password: data.password,
                timezone: data.timezone,
            },
        };

        let response = await createAdmin(allData);

        if (!response) {
            return enqueueSnackbar('An error has occured', { variant: 'error' });
        }

        if (response && response.Platform) {
            closeSnackbar();
            handleNext();
        } else {
            response.errors.map((err) => {
                return enqueueSnackbar(err.message, { variant: 'error' });
            });
        }
    }

    return (
        <Box component="form" sx={{ width: { sm: '250px' } }} onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ mt: 3, mb: 3 }} display="block">
                <Typography component="h3" variant="h2" color="text.primary">
                    Business
                </Typography>
                <TextField
                    label="Business name"
                    id="business_name"
                    size="small"
                    required
                    sx={{ mt: 2, mb: 2, fontSize: '.75rem', display: 'flex' }}
                    {...register('business_name', { required: true })}
                />

                <Autocomplete
                    disablePortal
                    id="combo-box-demo"
                    options={Object.keys(ct.getAllTimezones())}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Timezone"
                            id="timezone"
                            size="small"
                            sx={{ mt: 2, fontSize: '.75rem', display: 'flex' }}
                            {...register('timezone', { required: true })}
                        />
                    )}
                />

                {errors.businessName && (
                    <Typography variant="subtitle1" color="danger" mt={1}>
                        This field is required
                    </Typography>
                )}
            </Box>

            <Box sx={{ mt: 6, mb: 3 }} display="block">
                <Typography component="h3" variant="h2" color="text.primary">
                    Admin user
                </Typography>
                <TextField
                    label="First name"
                    id="first_name"
                    size="small"
                    required
                    sx={{ mt: 2, mb: 2, fontSize: '.75rem', display: 'flex' }}
                    {...register('first_name', { required: true })}
                />
                <TextField
                    label="Last name"
                    id="last_name"
                    size="small"
                    required
                    sx={{ mb: 2, fontSize: '.75rem', display: 'flex' }}
                    {...register('last_name', { required: true })}
                />
                <TextField
                    label="Email"
                    id="email"
                    type="email"
                    size="small"
                    required
                    sx={{ mb: 2, fontSize: '.75rem', display: 'flex' }}
                    {...register('email', { required: true })}
                />
                <TextField
                    label="Job title"
                    id="job_title"
                    size="small"
                    required
                    sx={{ mb: 2, fontSize: '.75rem', display: 'flex' }}
                    {...register('job_title', { required: true })}
                />
                <PasswordField
                    label="Password"
                    id="password"
                    name="password"
                    type="password"
                    size="small"
                    required
                    style={{ fontSize: '.75rem', display: 'flex' }}
                    register={{ ...register('password', { required: true }) }}
                />
            </Box>

            <Box display="flex" alignItems="center" justifyContent="space-evenly">
                <ThemeToggle fromPage="get-started" />
                <Typography color="text.primary" fontSize={14} lineHeight="16.41px">
                    Mode{' '}
                    <Typography component="span" display="block" fontSize={14}>
                        preference
                    </Typography>
                </Typography>
            </Box>

            <Box sx={{ mt: '37px' }}>
                <Button variant="contained" type="submit" color="primary" sx={{ width: '100%' }}>
                    Next
                </Button>
            </Box>
        </Box>
    );
};

export default GetStartedForm;
