import { TextField, Typography, Box, Grid, Button } from "@mui/material";
import { useState } from "react";
import CustomInput from "../CustomInput";
import ThemeToggle from "../ThemeToggle";

const GetStartedForm = ({ setIsNext }) => {
    const [bussinessName] = useState();

    return (
        <>
            <Box sx={{ mt: 3, mb: 3 }} display="block">
                <Typography component="h3" variant="h2" color="text.primary">Bussiness</Typography>
                <TextField
                    label="Bussiness name"
                    id="bussiness_name"
                    size="small"
                    required
                    sx={{ mt: 2, mb: 2, fontSize: ".75rem", display: "flex" }}
                />

                <TextField
                    label="Timezone"
                    id="timezone"
                    select
                    size="small"
                    required
                    sx={{ fontSize: ".75rem", display: "flex" }}
                />
            </Box>

            <Box sx={{ mt: 3, mb: 3 }} display="block">
                <Typography component="h3" variant="h2" color="text.primary">Admin user</Typography>
                <TextField
                    label="First name"
                    id="first_name"
                    size="small"
                    required
                    sx={{ mt: 2, mb: 2, fontSize: ".75rem", display: "flex" }}
                />
                <TextField
                    label="Last name"
                    id="last_name"
                    size="small"
                    required
                    sx={{ mb: 2, fontSize: ".75rem", display: "flex" }}
                />
                <TextField
                    label="Email"
                    id="email"
                    type="email"
                    size="small"
                    required
                    sx={{ mb: 2,fontSize: ".75rem", display: "flex" }}
                />
                <TextField
                    label="Job title"
                    id="job_title"
                    size="small"
                    required
                    sx={{ mb: 2, fontSize: ".75rem", display: "flex" }}
                />
                <TextField
                    label="Password"
                    id="password"
                    type="password"
                    size="small"
                    required
                    sx={{ fontSize: ".75rem", display: "flex" }}
                />
            </Box>

            <Grid container alignItems="center" justifyContent="center">
                <ThemeToggle />
                <Typography ml="1.5rem" variant="subtitle1" color="text.primary">
                    Mode preference
                </Typography>
            </Grid>

            <Box sx={{ mt: "37px" }}>
                <Button variant="contained" color="primary" sx={{ width: "100%" }}>Next</Button>
            </Box>
        </>
    );
};

export default GetStartedForm;
