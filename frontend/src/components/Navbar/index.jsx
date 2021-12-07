import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import HeaderDropdown from "../HeaderDropdown";
import Typography from '@mui/material/Typography';

const Navbar = () => {
    return(
        <Box position="absolute" width="100%" sx={{ top: 0, left: 0, right: 0, border: 1, borderColor: "divider" }}>
            <Grid container alignItems="center" justifyContent="space-between">
                <Typography component="h1" variant="h1" color="primary" fontWeight={900} style={{ padding: "1.5rem 0 1.5rem .75rem" }}>Dataplane</Typography>
                <Box display="flex" alignItem="center" mr={8}>
                    <Box mr={24}>
                        <Typography sx={{ fontSize: 24 }}>22:47</Typography>
                        <Typography variant="h3" fontWeight={400} mt={-1}>Europe/London</Typography>
                    </Box>

                    {/* <HeaderDropdown title="Production" subtitle="Enviroment" />
                    <HeaderDropdown title="Saul Frank" user="Saul" subtitle="Data Engineer">
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Culpa reprehenderit id quisquam assumenda.</p>
                    </HeaderDropdown> */}
                </Box>
            </Grid>
        </Box>
    )
}

export default Navbar;