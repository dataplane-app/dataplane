import * as React from 'react';
import { styled } from '@mui/system';
import { ColorModeContext } from '../../App';
import { useTheme } from '@mui/material/styles';
import Switch from '@mui/material/Switch';
import MoonIcon from '../../assets/icons/moon.svg';
import { useGetOnePreference } from '../../graphql/getOnePreference';
import { useUpdatePreferences } from '../../graphql/updatePreferences';

const DarkToggle = styled(Switch)(({ theme }) => ({
    padding: 8,
    width: 94,
    height: 40,
    '& .MuiSwitch-switchBase': {
        transform: 'translateX(2px)',
        '&:hover': {
            background: 'none',
        },
        '&.Mui-checked': {
            '& .MuiSwitch-thumb': {
                transform: 'translateX(29px)',
            },
            '& .MuiTouchRipple-root': {
                right: -37,
                left: 25,
            },
            '&:hover': {
                background: 'none',
            },
            '& +.MuiSwitch-track': {
                background: 'transparent!important',
                opacity: 1,
            },
        },
    },
    '& .MuiSwitch-track': {
        borderRadius: 22 / 2,
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(14, 25, 40, 1)' : '#fff',
        color: theme.palette.mode === 'dark' ? '#fff' : '#000',
        opacity: 1,
        '&:after': {
            content: theme.palette.mode === 'dark' ? '"Dark"' : '"Light"',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: theme.palette.mode !== 'dark' ? 'translate(-83%, -45%)' : 'translate(-18%, -45%)',
            fontSize: 15,
            fontWeight: 700,
        },
    },
    '& .MuiTouchRipple-root': {
        display: 'none',
    },
    '& .MuiSwitch-thumb': {
        boxShadow: 'none',
        transform: 'translateX(-7px)',
        width: 28,
        height: 28,
        margin: 2,
        top: -6,
        position: 'relative',
        background: 'transparent',
        border: `1px solid ${theme.palette.mode === 'dark' ? '#315A90' : '#C7C3C3'}`,
    },
    '&:before': {
        content: "''",
        position: 'absolute',
        top: theme.palette.mode === 'dark' ? 10 : 0,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        height: theme.palette.mode === 'dark' ? 17 : '100%',
        width: theme.palette.mode === 'dark' ? 17 : '100%',
        right: theme.palette.mode === 'dark' ? 'auto' : -28,
        left: theme.palette.mode === 'dark' ? 11 : 'auto',
        backgroundImage:
            theme.palette.mode === 'dark'
                ? `url(${MoonIcon})`
                : `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
                      '#FBC400'
                  )}" d="M9.305 1.667V3.75h1.389V1.667h-1.39zm-4.707 1.95l-.982.982L5.09 6.072l.982-.982-1.473-1.473zm10.802 0L13.927 5.09l.982.982 1.473-1.473-.982-.982zM10 5.139a4.872 4.872 0 00-4.862 4.86A4.872 4.872 0 0010 14.862 4.872 4.872 0 0014.86 10 4.872 4.872 0 0010 5.139zm0 1.389A3.462 3.462 0 0113.471 10a3.462 3.462 0 01-3.473 3.472A3.462 3.462 0 016.527 10 3.462 3.462 0 0110 6.528zM1.665 9.305v1.39h2.083v-1.39H1.666zm14.583 0v1.39h2.084v-1.39h-2.084zM5.09 13.928L3.616 15.4l.982.982 1.473-1.473-.982-.982zm9.82 0l-.982.982 1.473 1.473.982-.982-1.473-1.473zM9.305 16.25v2.083h1.389V16.25h-1.39z"/></svg>')`,
    },
}));

const ThemeToggle = (props) => {
    const getOnePreference = useGetOnePreference();
    const updatePreferences = useUpdatePreferences();

    const theme = useTheme();
    const colorMode = React.useContext(ColorModeContext);

    // Retrieve color mode on load
    React.useEffect(() => {
        (async () => {
            const colorModeResponse = await getOnePreference({ preference: 'theme' });

            // If color mode in DB doesn't match current color mode, toggle.
            if (!colorModeResponse.errors) {
                if (colorModeResponse.value !== theme.palette.mode) {
                    colorMode.toggleColorMode();
                }
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Toggle color mode on click
    async function handleClick() {
        const color = theme.palette.mode === 'light' ? 'dark' : 'light';
        const input = { input: { preference: 'theme', value: color } };
        colorMode.toggleColorMode();
        const updateEnvironmentsResponse = await updatePreferences(input);

        if (updateEnvironmentsResponse.errors) {
            console.log('Unable to update color theme');
        }
    }

    return (
        <DarkToggle
            {...props}
            disableTouchRipple={true}
            checked={theme.palette.mode !== 'dark'}
            onClick={handleClick}
            sx={{
                padding: 0,
                borderRadius: 19,
                border: `1px solid ${theme.palette.mode === 'dark' ? '#315A90' : '#C7C3C3'}`,
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(14, 25, 40, 1)' : '#fff',
            }}
        />
    );
};

export default ThemeToggle;
