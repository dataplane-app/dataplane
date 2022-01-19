import { Box, Grid, Button } from '@mui/material';
import Lottie from 'react-lottie';
import Confetti from '../assets/animations/confetti.json';
import { useHistory } from 'react-router-dom';
import { Typography } from '@mui/material';

const Congratulations = () => {
    let history = useHistory();

    return (
        <Box className="congratulation" height="100vh" position="relative" sx={{ overflowY: 'hidden' }}>
            <Box position="absolute" width="100%" sx={{ top: 0, left: 0, right: 0, border: 1, borderColor: 'divider' }}>
                <Typography component="h1" variant="h1" color="secondary" fontWeight={700} style={{ padding: '1.5rem 0 1.5rem .75rem' }}>
                    Dataplane
                </Typography>
            </Box>

            <Grid container alignItems="center" justifyContent="center" height="100%">
                <Box height="100%" position="absolute" zIndex={1} bottom="-100px">
                    <Lottie
                        options={{
                            animationData: Confetti,
                            autoplay: true,
                        }}
                        loop
                        isClickToPauseDisabled={true}
                    />
                </Box>
                <div>
                    <Grid display="flex" alignItems="center" position="relative">
                        <Typography fontSize="3.75rem" textAlign="center" fontWeight="700" color="purple.main">
                            Congratulations
                        </Typography>
                        <Typography position="absolute" fontSize="3.75rem" right="-5rem">
                            🎉
                        </Typography>
                    </Grid>

                    <Typography mt="1.25rem" color="purple.main" textAlign="center" fontSize="1.125rem">
                        Ready to build data pipelines!
                    </Typography>

                    <Box zIndex="10" position="relative" sx={{ margin: '15.18rem auto 0', width: { md: '387.66px' } }}>
                        <Button variant="contained" size="large" color="primary" sx={{ width: '100%' }} onClick={() => history.push('/')}>
                            Let’s get started
                        </Button>
                    </Box>
                </div>
            </Grid>
        </Box>
    );
};

export default Congratulations;
