import { Box, Typography } from '@mui/material';
import Lottie from 'react-lottie';
import NotDesktopAnimation from '../../assets/animations/not_desktop.json';

const NotDesktop = () => {
    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: NotDesktopAnimation,
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice',
        },
    };

    return (
        <Box className="get-started" height="100vh" sx={{ overflowX: 'hidden' }}>
            <Box position="relative" width="100%" sx={{ top: 0, left: 0, right: 0, border: 1, borderColor: 'divider' }}>
                <Typography component="h1" variant="h1" color="secondary" fontWeight={700} style={{ padding: '1.5rem 0 1.5rem .75rem' }}>
                    Dataplane
                </Typography>
            </Box>

            <Box sx={{ padding: '30px 10px 0 30px' }} zIndex={10} position="relative">
                <Typography fontWeight={700} fontSize={59} color="#7B61FF" lineHeight="69.14px">
                    We need more space.
                </Typography>

                <Typography mt={7} fontWeight={700} fontSize={59} color="#7B61FF" lineHeight="69.14px">
                    Switch to desktop.
                </Typography>
            </Box>

            <Box position="absolute" bottom="0" left="0" right="0" zIndex={1}>
                <Lottie options={defaultOptions} height={323} width="100%" />
            </Box>
        </Box>
    );
};

export default NotDesktop;
