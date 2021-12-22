import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import EnviromentDropdown from "../EnviromentDropdown";
import Typography from '@mui/material/Typography';
import UserDropdown from '../UserDropdown';

const Navbar = () => {
    return(
        <Grid container alignItems="center" justifyContent="space-between" flexWrap="nowrap">
            <Typography component="h1" variant="h1" color="secondary" fontWeight={900} style={{ padding: "1.5rem 0 1.5rem .75rem" }}>Dataplane</Typography>
            <Box display="flex" alignItems="center" mr={2}>
                <Box mr={4} sx={{ display: { xxs: "none" , md: "block" } }}>
                    <Typography sx={{ fontSize: 24 }} color="text.primary">22:47</Typography>
                    <Typography variant="h3" fontWeight={400} mt={-1} color="text.primary">Europe/London</Typography>
                </Box>

                <Box display="flex" alignItems="center">
                    <EnviromentDropdown />
                    <UserDropdown />
                </Box>
            </Box>
        </Grid>
    )
}

export default Navbar;