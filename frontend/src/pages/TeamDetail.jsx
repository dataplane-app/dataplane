import { Box, Grid, Typography, Chip, Avatar, IconButton, Button } from '@mui/material';
import { useState } from "react";
import Pills from "../components/Pills";
import CustomInput from "../components/CustomInput";
import Search from "../components/Search";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import {
    belongToAcessGroupsItems,
    belongToEnvironmentItems,
    environmentPermissions,
    expecificPermissionsItems,
    platformItems,
} from "../utils/teamsMockData";

const TeamDetail = () => {
    const [isActive] = useState(true);
    const [isAdmin] = useState(true);

    return (
        <Box className="team_details" width="83%">
            <Grid container alignItems="center">
                <Typography component="h2" variant="h2" color="text.primary">
                    Team {" > "} Saul Frank
                </Typography>

                <Grid item ml={4}>
                    {isActive && <Chip label="Active" color="success" size="small" sx={{  mr: 1 }} />}
                    {isAdmin && <Chip label="Admin" color="primary" size="small"/>}
                </Grid>
            </Grid>

            <Grid container mt={5} alignItems="flex-start" justifyContent="space-between">
                <Grid item>
                    <Typography component="h3" variant="h3" color="text.primary">
                        Details
                    </Typography>
                </Grid>
                <Grid item>
                    Column 2
                </Grid>
                <Grid item>
                    Column 3
                </Grid>
            </Grid>
        </Box>
    );
};

export default TeamDetail;
