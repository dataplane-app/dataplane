import { Box, Typography } from '@mui/material';
import NotDesktopAnimation from '../../assets/animations/not_desktop.json';
require("@lottiefiles/lottie-player");

const NotDesktop = () => {

    // console.log("NotDesktop", NotDesktopAnimation, JSON.stringify(NotDesktopAnimation));
    NotDesktopAnimation = JSON.stringify(NotDesktopAnimation);

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
                {/* configure player : https://lottiefiles.com/web-player - To remove controls: remove controls variable. not controls={{false}}
                Same for autopay and loop, keep in to set true but not ={{true}}
                See performance - Chrome Dev Tools cmd shift P or three dots on dev tools -> Run command -> Performance monitor
                */}
                <lottie-player
                autoplay
                loop
                mode="normal"
                src={NotDesktopAnimation}
                style={{Width: "100%"}}
                ></lottie-player>
            </Box>
        </Box>
    );
};

export default NotDesktop;
