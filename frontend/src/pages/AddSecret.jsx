import { Box, Button, Grid, IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { useHistory } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useCreateSecret } from '../graphql/createSecret';
import { useGlobalEnvironmentState } from '../components/EnviromentDropdown';

const AddSecret = () => {
    // Secret states
    const [isShowingSecret, setIsShowingSecret] = useState(false);

    // Form
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm();

    // Ref for scroll to top
    const scrollRef = useRef(null);

    // Custom GraphQL hook
    const createSecret = useCreateSecret_();

    useEffect(() => {
        // Scroll to top on load
        scrollRef.current.parentElement.scrollIntoView();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Box className="page" ref={scrollRef}>
            <Typography component="h2" variant="h2" color="text.primary">
                Add Secret
            </Typography>

            <Grid container alignItems="flex-start" mt={4}>
                <Box sx={{ width: '212px' }}>
                    <form onSubmit={handleSubmit(createSecret)}>
                        <TextField
                            label="Name"
                            id="name"
                            size="small"
                            required
                            sx={{ mb: 2, fontSize: '.75rem', display: 'flex' }}
                            {...register('name', { pattern: /^[A-Za-z0-9_]+$/i })}
                        />
                        {errors.name?.type === 'pattern' ? (
                            <Typography variant="subtitle2" mt={1} mb={2} color={'red'} sx={{ width: 'max-content' }}>
                                Only [a-z], [A-Z], [0-9] and _ are allowed
                            </Typography>
                        ) : null}

                        <TextField
                            label="Description"
                            id="description"
                            size="small"
                            required
                            sx={{ mb: 2, fontSize: '.75rem', display: 'flex' }}
                            {...register('description', { required: true })}
                        />

                        <TextField
                            label="Secret"
                            type={isShowingSecret ? 'text' : 'password'}
                            id="secret"
                            size="small"
                            required
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="start">
                                        <IconButton aria-label="toggle password visibility" onClick={() => setIsShowingSecret(!isShowingSecret)} edge="end">
                                            <Box component={FontAwesomeIcon} sx={{ fontSize: 17 }} icon={isShowingSecret ? faEyeSlash : faEye} />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ mb: 2, fontSize: '.75rem', display: 'flex' }}
                            {...register('secret', { required: true })}
                        />

                        <Grid mt={3} display="flex" alignItems="center">
                            <Button type="submit" variant="contained" color="primary" style={{ width: '100%' }}>
                                Save
                            </Button>
                        </Grid>
                    </form>
                </Box>

                <Typography variant="subtitle2" ml={4} mt={1}>
                    Environment variable: secret_dp_{watch('name') ? watch('name').toLowerCase() : null}
                </Typography>
            </Grid>
        </Box>
    );
};

export default AddSecret;

// ----------- Custom Hooks
const useCreateSecret_ = () => {
    // React router
    const history = useHistory();

    // Global environment state with hookstate
    const Environment = useGlobalEnvironmentState();

    // GraphQL hook
    const createSecret = useCreateSecret();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Create secret
    return async (data) => {
        const variables = {
            input: {
                Secret: data.name,
                Description: data.description,
                Value: data.secret,
                Active: true,
                EnvironmentId: Environment.id.get(),
            },
        };
        const response = await createSecret(variables);

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't create secret: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': create secret failed', { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            history.push(`/secrets`);
        }
    };
};
