import { Box, Button, Drawer, Grid, TextField, Typography } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import DeleteSecretDrawer from '../components/DrawerContent/DeleteSecretDrawer';
import ChangeSecretDrawer from '../components/DrawerContent/ChangeSecretDrawer';

const SecretDetail = () => {
    // States
    const [isOpenDeleteSecret, setIsOpenDeleteSecret] = useState(false);
    const [isOpenChangeSecret, setIsOpenChangeSecret] = useState(false);

    // Ref for scroll to top
    const scrollRef = useRef(null);

    useEffect(() => {
        // Scroll to top on load
        scrollRef.current.parentElement.scrollIntoView();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Form
    const { register, handleSubmit, watch } = useForm();

    async function onSubmit(data) {
        console.log(data);
    }

    return (
        <>
            <Box className="page" ref={scrollRef}>
                <Typography component="h2" variant="h2" color="text.primary">
                    Secrets {' > '} Squirrel
                </Typography>

                <Grid container alignItems="flex-start" mt={4}>
                    <Box sx={{ width: '250px' }}>
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

                            <Grid container alignItems="center" mt={2} mb={2}>
                                <Box component={FontAwesomeIcon} sx={{ color: '#70AD46', fontSize: 16 }} icon={faLock} />
                                <Typography ml={1.5} mr={4} flex={1} variant="subtitle1">
                                    Secret: ******
                                </Typography>
                                <Button variant="text" onClick={() => setIsOpenChangeSecret(true)}>
                                    Change
                                </Button>
                            </Grid>

                            <Grid mt={3} display="flex" alignItems="center">
                                <Button type="submit" variant="contained" color="primary" style={{ width: '100%' }}>
                                    Save
                                </Button>
                            </Grid>
                        </form>
                        <Box sx={{ margin: '2.45rem 0', borderTop: 1, borderColor: 'divider' }}></Box>

                        <Button
                            onClick={() => setIsOpenDeleteSecret(true)}
                            size="small"
                            variant="outlined"
                            color="error"
                            sx={{ fontWeight: '700', width: '100%', fontSize: '.81rem', border: 2, '&:hover': { border: 2 } }}>
                            Delete secret
                        </Button>

                        <Typography color="rgba(248, 0, 0, 1)" lineHeight="15.23px" sx={{ mt: '.56rem' }} variant="subtitle2">
                            Warning: this action can’t be undone.
                        </Typography>
                    </Box>

                    <Typography variant="subtitle2" ml={4} mt={1}>
                        Environment variable: secret_{watch('name') ? watch('name').toLowerCase() : 'squirrel'}
                    </Typography>
                </Grid>
            </Box>

            <Drawer anchor="right" open={isOpenDeleteSecret} onClose={() => setIsOpenDeleteSecret(!isOpenDeleteSecret)}>
                <DeleteSecretDrawer secretName="Squirrel" handleClose={() => setIsOpenDeleteSecret(false)} />
            </Drawer>

            <Drawer anchor="right" open={isOpenChangeSecret} onClose={() => setIsOpenChangeSecret(!isOpenChangeSecret)}>
                <ChangeSecretDrawer secretName="Squirrel" handleClose={() => setIsOpenChangeSecret(false)} />
            </Drawer>
        </>
    );
};

export default SecretDetail;
