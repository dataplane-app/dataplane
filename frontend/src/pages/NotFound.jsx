import { Grid, useTheme } from '@mui/material';
import Lottie from 'react-lottie';
import NotFoundAnimation from '../assets/animations/not_found.json';
import NotFoundDarkAnimation from '../assets/animations/not_found_dark.json';
import useWindowSize from '../hooks/useWindowsSize';

const NotFound = (props) => {
    const theme = useTheme();
    const { width } = useWindowSize();

    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: theme.palette.mode === 'light' ? NotFoundAnimation : NotFoundDarkAnimation,
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice',
        },
    };

    return (
        <Grid container alignItems="flex-end" justifyContent="center" sx={{ height: 'calc(100vh - 119px)' }} position="relative">
            <Lottie
                options={defaultOptions}
                height={width > 1400 ? '100%' : '80%'}
                width={width > 1400 ? '80%' : '100%'}
                style={{ marginTop: '25px', position: 'absolute', bottom: '-32px', left: 0, right: 0 }}
            />
        </Grid>
    );
};

export default NotFound;
