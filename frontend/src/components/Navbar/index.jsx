import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import HeaderDropdown from "../HeaderDropdown";
import Typography from '@mui/material/Typography';

const Navbar = () => {
    return(
        <Grid container alignItems="center" justifyContent="space-between">
            <Typography component="h1" variant="h1" color="secondary" fontWeight={900} style={{ padding: "1.5rem 0 1.5rem .75rem" }}>Dataplane</Typography>
            <Box display="flex" alignItem="center" mr={8}>
                <Box mr={24}>
                    <Typography sx={{ fontSize: 24 }} color="text.primary">22:47</Typography>
                    <Typography variant="h3" fontWeight={400} mt={-1} color="text.primary">Europe/London</Typography>
                </Box>
            </Box>
        </Grid>
    )
}

export default Navbar;