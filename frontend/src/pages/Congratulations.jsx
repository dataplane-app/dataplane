
import { Box, Grid, Button} from "@mui/material";
import Lottie from "react-lottie";
import Confetti from '../assets/animations/confetti.json';
import { useNavigate } from "react-router-dom";
import { Typography } from "@mui/material";

const Congratulations = () => {
    let navigate = useNavigate();

    return(
        <Box className="congratulation" height="100vh" position="relative" sx={{ overflowY: "hidden" }}>
            <Box position="absolute" width="100%" sx={{ top: 0, left: 0, right: 0, border: 1 ,borderColor: "divider" }}>
                <Typography component="h1" variant="h1" color="primary" fontWeight={900} style={{ padding: "1.5rem 0 1.5rem .75rem" }}>Dataplane</Typography>
            </Box>

            <Grid container alignItems="center" justifyContent="center" height="100%" >

                <div>
                    <Grid container alignItems="center" position="relative">
                        <Typography fontSize="3.75rem" textAlign="center" fontWeight="700" color="primary">Congratulations</Typography>
                        <Typography position="absolute" fontSize="3.75rem" right="6rem">🎉</Typography>
                    </Grid>

                    <Typography mt="1.25rem" color="primary" textAlign="center" fontSize="1.125rem">Ready to build data pipelines!</Typography>
                    
                    <Box mt="1.25rem" width="75%" margin="0 auto" zIndex="10" position="relative">
                        <Button variant="contained" color="secondary" sx={{ width: "100%" }} onClick={() => navigate('/')} >Let’s get started</Button>
                    </Box>
                </div>
            </Grid>
        </Box>
    )
}

export default Congratulations;