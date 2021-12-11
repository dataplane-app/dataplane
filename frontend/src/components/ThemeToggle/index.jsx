import { Grid, Box, Typography } from "@mui/material";
import { useDarkMode } from "../../hooks/useDarkMode";
import './styles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMoon } from '@fortawesome/free-solid-svg-icons'
import { faSun } from '@fortawesome/free-regular-svg-icons'

const ThemeToggle = () => {
    const [isDark, setIsDark] = useDarkMode();
 
    return (
        <Grid container alignItems="center" justifyContent="center" width="94px">
            <Box component="label" display="flex" alignItems="center" sx={{ cursor: "pointer" }}>
                <Box position="relative">
                    <input type="checkbox" id="toggleTheme" checked={!isDark} className="inputSr" onChange={() => setIsDark(!isDark)} />
                    <Box className="toggle_block"></Box>
                    <Typography variant="subtitle2" fontWeight="700" color="text.primary" className="toggleText">{isDark ? 'Dark' : 'Light'}</Typography>
                    <Box className="toggle_dot" sx={{ background: "background.default" }}>
                        <FontAwesomeIcon icon={isDark ? faMoon : faSun} className="text-yellow-400 dark:text-darkIcons"/>
                    </Box>
                </Box>
            </Box>
        </Grid>
    )
};

export default ThemeToggle;
