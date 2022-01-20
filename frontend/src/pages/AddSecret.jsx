import { Box, Button, Grid, IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const AddSecret = () => {
    // Secret states
    const [isShowingSecret, setIsShowingSecret] = useState(false);

    // Form
    const { register, handleSubmit, watch } = useForm();

    // Ref for scroll to top
    const scrollRef = useRef(null);

    useEffect(() => {
        // Scroll to top on load
        scrollRef.current.parentElement.scrollIntoView();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function onSubmit(data) {
        console.log(data);
    }

    return (
        <Box className="page" ref={scrollRef}>
            <Typography component="h2" variant="h2" color="text.primary">
                Add Secret
            </Typography>

            <Grid container alignItems="flex-start" mt={4}>
                <Box sx={{ width: '212px' }}>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <TextField label="Name" id="name" size="small" required sx={{ mb: 2, fontSize: '.75rem', display: 'flex' }} {...register('name', { required: true })} />

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
                    Environment variable: secret_{watch('name') ? watch('name').toLowerCase() : null}
                </Typography>
            </Grid>
        </Box>
    );
};

export default AddSecret;
