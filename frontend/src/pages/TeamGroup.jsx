import { Box, Grid, Typography, Chip, Avatar, IconButton, Button, TextField } from '@mui/material';
import { useState } from "react";
import CustomInput from "../components/CustomInput";
import Search from "../components/Search";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashAlt } from "@fortawesome/free-regular-svg-icons";
import {
    belongToAcessGroupsItems,
    belongToEnvironmentItems,
    environmentPermissions,
    expecificPermissionsItems,
    platformItems,
} from "../utils/teamsMockData";
import CustomChip from '../components/CustomChip';

const TeamGroup = () => {
    const [isActive] = useState(true);
    const [isAdmin] = useState(true);

    return (
        <Box className="team_details" width="83%">
            <Grid container alignItems="center">
                <Typography component="h2" variant="h2" color="text.primary">
                    Team {">"} Access group {">"} Data engineering team
                </Typography>
            </Grid>

            <Grid container mt="2.56rem" alignItems="flex-start" justifyContent="space-between">
                <Grid item sx={{ flex: 1 }}>
                    <Typography component="h3" variant="h3" color="text.primary">
                        Details
                    </Typography>

                    <Box mt={2} display="grid" flexDirection="row">
                        <TextField
                            label="Access group name"
                            id="access_group_name"
                            size="small"
                            required
                            sx={{ mb: ".45rem" }}
                        />

                        <Button variant="contained" color="primary" sx={{ width: "100%", mt: "1.375rem" }}>Save</Button>
                    </Box>

                    <Box mt="3rem">
                        <Button size="small" variant="outlined" color="error" sx={{ fontWeight: "700", width: "100%", mt: ".78rem", fontSize: ".81rem", border: 2, "&:hover": { border: 2 } }}>Delete access group</Button>
    
                        <Typography color="rgba(248, 0, 0, 1)" lineHeight="15.23px" sx={{ mt: ".56rem" }} variant="subtitle2">
                            Warning: this action can’t be undone.
                        </Typography>
                    </Box>

                </Grid>
                <Grid item sx={{ flex: 2.2, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                    <Box>
                        <Typography component="h3" variant="h3" color="text.primary">
                            Permissions
                        </Typography>

                        <Grid mt={2} display="flex" alignItems="center">
                            <Search placeholder="Find platform permissions" />
                            <Button variant="contained" color="primary" height="100%" sx={{ ml: 1 }} >Add</Button>
                        </Grid>

                        <Box mt={4}>
                            <Typography component="h3" variant="h3" color="text.primary">
                                Platform
                            </Typography>
                        </Box>

                        <Box mt={2}>
                            {
                                platformItems.map(plat => (
                                    <Grid display="flex" alignItems="center" key={plat.id} mt={1.5} mb={1.5}>
                                        <Box component={FontAwesomeIcon} sx={{ fontSize: "17px",mr: "7px", color: "rgba(248, 0, 0, 1)" }} icon={faTrashAlt} />
                                        <Typography variant="subtitle2" lineHeight="15.23px">{plat.name}</Typography>
                                    </Grid>
                                ))
                            }
                        </Box>
                        <Box mt="2.31rem">
                            <Typography component="h3" variant="h3" color="text.primary">
                                Environment permissions
                            </Typography>
                            <Typography variant="subtitle2" mt=".20rem">Environment: Production</Typography>

                            <Box mt={2}>
                                {
                                    environmentPermissions.map(env => (
                                        <Grid display="flex" alignItems="center" key={env.id} mt={1.5} mb={1.5}>
                                            <Box component={FontAwesomeIcon} sx={{ fontSize: "17px",mr: "7px", color: "rgba(248, 0, 0, 1)" }} icon={faTrashAlt} />
                                            <Typography variant="subtitle2" lineHeight="15.23px">{env.name}</Typography>
                                        </Grid>
                                    ))
                                }
                            </Box>
                        </Box>

                        <Box mt="3.5rem">
                            <Typography component="h3" variant="h3" color="text.primary">
                                Specific permissions
                            </Typography>
                            <Typography variant="subtitle2" mt=".20rem">Environment: Production</Typography>

                            <Box mt={2}>
                                {
                                    expecificPermissionsItems.map(exp => (
                                        <Grid display="flex" alignItems="center" key={exp.id} mt={1.5} mb={1.5}>
                                            <Box component={FontAwesomeIcon} sx={{ fontSize: "17px",mr: "7px", color: "rgba(248, 0, 0, 1)" }} icon={faTrashAlt} />
                                            <Typography variant="subtitle2" lineHeight="15.23px">{exp.name}</Typography>
                                        </Grid>
                                    ))
                                }
                            </Box>
                        </Box>
                    </Box>

                </Grid>
                <Grid item sx={{ flex: 1 }}>
                    <Typography component="h3" variant="h3" color="text.primary">
                        Members (10)
                    </Typography>

                    <Grid mt={2} display="flex" alignItems="center">
                        <Search placeholder="Find members" />
                        <Button variant="contained" color="primary" height="100%" sx={{ ml: 1 }} >Add</Button>
                    </Grid>

                    <Box mt="1.31rem">
                        <Grid display="flex" alignItems="center" mt={1.5} mb={1.5}>
                            <Box component={FontAwesomeIcon} sx={{ fontSize: "17px",mr: "7px", color: "rgba(248, 0, 0, 1)" }} icon={faTrashAlt} />
                            <Typography variant="subtitle2" lineHeight="15.23px" color="primary" fontWeight="900">Saul Frank</Typography>
                        </Grid>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default TeamGroup;
