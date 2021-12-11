import { Box, Typography, Button, Grid, TextField } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import Search from "../../Search";

const ChangePasswordDrawer = () => {
    return (
        <Box position="relative">
            <Box sx={{ p: "4.125rem" }}>

                <Box position="absolute" top="26px" right="39px" display="flex" alignItems="center">
                    <Button variant="text" startIcon={<FontAwesomeIcon icon={faTimes} />}>
                        Close
                    </Button>
                </Box>
                
                <Typography component="h2" variant="h2">
                    Change password
                </Typography>

                <Grid mt={3.4} display="flex" alignItems="center">
                    <TextField
                        label="New password"
                        id="new_password"
                        size="small"
                    />
                    <Button variant="contained" color="primary" height="100%" sx={{ ml: 1 }} >Submit</Button>
                </Grid>
            </Box>
        </Box>
    )
}

export default ChangePasswordDrawer;