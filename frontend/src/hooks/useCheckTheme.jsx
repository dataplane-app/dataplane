import { useTheme } from '@mui/material';
import { useEffect } from 'react';
import { useContext } from 'react';
import { ColorModeContext } from '../App';

const CheckTheme = () => {
    const theme = useTheme();
    const colorMode = useContext(ColorModeContext);

    useEffect(() => {
        const themeData = localStorage.getItem('theme');

        if (themeData) {
            if (themeData !== theme.palette.mode) {
                colorMode.toggleColorMode();
            }
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
};

export default CheckTheme;
