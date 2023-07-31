import { Grid, useTheme } from '@mui/material';
import NotFoundAnimation from '../assets/animations/not_found.json';
import NotFoundDarkAnimation from '../assets/animations/not_found_dark.json';
import useWindowSize from '../hooks/useWindowsSize';
require("@lottiefiles/lottie-player");

const NotFound = (props) => {
    const theme = useTheme();
    const { width } = useWindowSize();

    let AnimationData = JSON.stringify(NotFoundAnimation);

    if (theme.palette.mode === 'dark') {
        AnimationData = JSON.stringify(NotFoundDarkAnimation);
    }

    let animationwidth = '100%';
    let animationheight = '80%';

    if (width > 1400) {
        animationwidth = '80%';
        animationheight = '100%';
    }

    // const defaultOptions = {
    //     loop: true,
    //     autoplay: true,
    //     animationData: theme.palette.mode === 'light' ? NotFoundAnimation : NotFoundDarkAnimation,
    //     rendererSettings: {
    //         preserveAspectRatio: 'xMidYMid slice',
    //     },
    // };

    return (
        <Grid container alignItems="flex-end" justifyContent="center" sx={{ height: 'calc(100vh - 119px)' }} position="relative">
            {/* <Lottie
                options={defaultOptions}
                height={width > 1400 ? '100%' : '80%'}
                width={width > 1400 ? '80%' : '100%'}
                style={{ marginTop: '25px', position: 'absolute', bottom: '-32px', left: 0, right: 0 }}
            /> */}

<lottie-player
                autoplay
                loop
                mode="normal"
                src={AnimationData}
                style={{Width: animationwidth, Height: animationheight}}
                ></lottie-player>
        </Grid>
    );
};

export default NotFound;
