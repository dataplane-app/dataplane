import { Box, Grid, Typography, Chip, Avatar, IconButton, Button, TextField, Drawer } from '@mui/material';
import { useState } from "react";
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
import ChangePasswordDrawer from '../components/DrawerContent/ChangePasswordDrawer';
import DeleteUserDrawer from '../components/DrawerContent/DeleteUserDrawer';
import {useHistory} from "react-router-dom";

const drawerWidth = 507;
const drawerStyles = {
    width: drawerWidth,
    flexShrink: 0,
    zIndex: 9999,
    [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box'},
}

const TeamDetail = () => {
    const [isActive] = useState(true);
    const [isAdmin] = useState(true);
    let history = useHistory();

    // Sidebar states
    const [isOpenChangePassword, setIsOpenPassword] = useState(false);
    const [isOpenDeleteUser, setIsOpenDeleteUser] = useState(false);

    return (
        <>
        <Box className="page" width="83%">
            <Grid container alignItems="center">
                <Typography component="h2" variant="h2" color="text.primary">
                    Team {" > "} Saul Frank
                </Typography>

                <Grid item ml={4}>
                    {isActive ? <CustomChip label="Active" customColor="green" margin={1} /> : <CustomChip label="Inactive" customColor="red" margin={1} />}
                    {isAdmin && <CustomChip label="Admin" customColor="orange"/>}
                </Grid>
            </Grid>

            <Grid container mt={5} alignItems="flex-start" justifyContent="space-between">
                <Grid item sx={{ flex: 1 }}>
                    <Typography component="h3" variant="h3" color="text.primary">
                        Details
                    </Typography>

                    <Box mt={2} display="grid" flexDirection="row">
                        <TextField
                            label="First name"
                            id="first_name"
                            size="small"
                            required
                            sx={{ mb: ".45rem" }}
                        />

                        <TextField
                            label="Last name"
                            id="last_name"
                            size="small"
                            required
                            sx={{ margin: ".45rem 0" }}
                        />

                        <TextField
                            label="Email"
                            type="email"
                            id="email"
                            size="small"
                            required
                            sx={{ margin: ".45rem 0" }}
                        />

                        <TextField
                            label="Job title"
                            id="job_title"
                            size="small"
                            required
                            sx={{ margin: ".45rem 0" }}
                        />

                        <TextField
                            label="Timezone"
                            id="timezone"
                            select
                            size="small"
                            required
                            sx={{ fontSize: ".75rem", display: "flex", mt: ".45rem" }}
                        />

                        <Button variant="contained" color="primary" sx={{ width: "100%", mt: "1rem" }}>Save</Button>
                    </Box>

                    <Box sx={{ margin: "2.45rem 0", borderTop: 1, borderColor: "divider" }}></Box>

                    <Box>
                        <Typography component="h3" variant="h3" color="text.primary">
                            Control
                        </Typography>

                        <Button onClick={() => setIsOpenPassword(true)} size="small" variant="outlined" color="error" sx={{ fontWeight: "700", width: "100%", mt: ".78rem", fontSize: ".81rem", border: 2, "&:hover": { border: 2 } }}>Change password</Button>
                        <Button size="small" variant="outlined" color={isActive ? "error" : "success"} sx={{ fontWeight: "700", width: "100%", mt: ".78rem", fontSize: ".81rem", border: 2, "&:hover": { border: 2 }}}>{isActive ? "Deactivate" : "Activate"} user</Button>
                        <Button onClick={() => setIsOpenDeleteUser(true)} size="small" variant="outlined" color="error" sx={{ fontWeight: "700", width: "100%", mt: ".78rem", fontSize: ".81rem", border: 2, "&:hover": { border: 2 }}}>Delete user</Button>

                        <Typography color="rgba(248, 0, 0, 1)" lineHeight="15.23px" sx={{ mt: ".56rem" }} variant="subtitle2">
                            Warning: this action can’t be undone. It is usually better to deactivate a user. 
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
                        Belongs to environments
                    </Typography>

                    <Grid mt={2} display="flex" alignItems="center">
                        <Search placeholder="Find access groups" />
                        <Button variant="contained" color="primary" height="100%" sx={{ ml: 1 }} >Add</Button>
                    </Grid>

                    <Box mt="1.31rem">
                        {
                            belongToEnvironmentItems.map(env => (
                                <Grid display="flex" alignItems="center" key={env.id} mt={1.5} mb={1.5}>
                                    <Box component={FontAwesomeIcon} sx={{ fontSize: "17px",mr: "7px", color: "rgba(248, 0, 0, 1)" }} icon={faTrashAlt} />
                                    <Typography variant="subtitle2" lineHeight="15.23px" color="primary" fontWeight="900">{env.name}</Typography>
                                </Grid>
                            ))
                        }
                    </Box>

                    <Box mt="2.31rem">
                        <Typography component="h3" variant="h3" color="text.primary">
                            Belongs to access groups
                        </Typography>

                        <Grid mt={2} display="flex" alignItems="center">
                            <Search placeholder="Find access groups" />
                            <Button variant="contained" color="primary" height="100%" sx={{ ml: 1 }} >Add</Button>
                        </Grid>

                        <Box mt="1.31rem">
                            {
                                belongToAcessGroupsItems.map(env => (
                                    <Grid sx={{ cursor: "pointer", pt: 1.5, pb: 1.5 ,borderRadius: 2 ,"&:hover": { background: "rgba(196, 196, 196, 0.15)"} }} display="flex" alignItems="center" key={env.id} onClick={() => history.push(`/teams/access/${env.name}`)}>
                                        <Box component={FontAwesomeIcon} sx={{ fontSize: "17px",mr: "7px", color: "rgba(248, 0, 0, 1)" }} icon={faTrashAlt} />
                                        <Typography variant="subtitle2" lineHeight="15.23px" color="primary" fontWeight="900">{env.name}</Typography>
                                    </Grid>
                                ))
                            }
                        </Box>
                    </Box>
                </Grid>
            </Grid>
        </Box>

        <Drawer anchor="right" open={isOpenChangePassword} onClose={() => setIsOpenPassword(!isOpenChangePassword)} sx={drawerStyles}>
            <ChangePasswordDrawer />
        </Drawer>

        <Drawer anchor="right" open={isOpenDeleteUser} onClose={() => setIsOpenDeleteUser(!isOpenDeleteUser)} sx={drawerStyles}>
            <DeleteUserDrawer user="Saul Frank" handleClose={() => setIsOpenDeleteUser(false)}/>
        </Drawer>
        </>
    );
};

export default TeamDetail;
