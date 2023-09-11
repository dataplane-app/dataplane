import { Box, Container, Grid, Typography } from '@mui/material';
import { useState } from 'react';
import LoginForm from '../components/LoginForm';
import SetupLoader from '../components/SetupLoader';
import DetailData from '../assets/animations/detail.json';
import "@lottiefiles/lottie-player";

const Login = () => {

    const Detail = JSON.stringify(DetailData);

    const [isNext, setIsNext] = useState(false);

    return (
        <Box className="get-started" height="100vh" sx={{ overflowX: 'hidden' }}>
            <Box position="relative" width="100%" sx={{ top: 0, left: 0, right: 0, border: 1, borderColor: 'divider' }}>
                <Typography component="h1" variant="h1" color="secondary" fontWeight={700} style={{ padding: '1.5rem 0 1.5rem .75rem' }}>
                    Dataplane
                </Typography>
            </Box>

            <Container sx={{ mt: 12, mb: 6 }}>
                <Grid container alignItems="flex-start" justifyContent="center">
                    <Grid item flex={1}>
                        <Typography component="h2" fontWeight="700" fontSize="1.93rem" color="text.primary">
                            Login
                        </Typography>

                        {isNext ? <SetupLoader /> : <LoginForm handleNext={() => setIsNext(true)} />}
                    </Grid>

                    <Grid item flex={0.5}></Grid>

                    <Grid item flex={2}>
                    <lottie-player
                autoplay
                mode="normal"
                src={Detail}
                style={{Width: 500, Height: 350}}
                ></lottie-player>
     
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default Login;
