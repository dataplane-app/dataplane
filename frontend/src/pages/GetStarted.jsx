import { Box, Container ,Grid, Typography, Chip, Avatar, IconButton, Button } from '@mui/material';
import { useState } from "react";
import DataplaneDetail from "../assets/images/detail.png";
import GetStartedForm from "../components/GetStartedForm";
import SetupLoader from "../components/SetupLoader";

const GetStarted = () => {
    const [isNext, setIsNext] = useState(false);

    return (
        <Box className="get-started" height="100vh" sx={{ overflowX: "hidden" }}>
            <Box position="relative" width="100%" sx={{ top: 0, left: 0, right: 0, border: 1, borderColor: "divider" }}>
                <Typography component="h1" variant="h1" color="primary" fontWeight={900} style={{ padding: "1.5rem 0 1.5rem .75rem" }}>Dataplane</Typography>
            </Box>

            <Container sx={{ mt: 4, mb: 6 }}>
                <Grid container alignItems="flex-start" justifyContent="center">
                    <Grid item>
                        <Typography component="h2" fontWeight="700" fontSize="1.93rem" color="text.primary">First time setup</Typography>

                        {isNext ? <SetupLoader /> : <GetStartedForm setIsNext={setIsNext} />}
                    </Grid>

                    <Grid item>
                        <img
                            src={DataplaneDetail}
                            alt="DataPlane"
                            className="ml-4 md:ml-12 hidden transform scale-110 lg:block"
                        /> 
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default GetStarted;
