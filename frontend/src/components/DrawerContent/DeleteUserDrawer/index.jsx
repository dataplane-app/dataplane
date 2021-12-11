import { Box, Typography, Button, Grid, TextField } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

const DeleteUserDrawer = ({ user, handleClose }) => {
    return (
        <Box position="relative">
            <Box sx={{ p: "4.125rem" }}>

                <Box position="absolute" top="26px" right="39px" display="flex" alignItems="center">
                    <Button variant="text" startIcon={<FontAwesomeIcon icon={faTimes} onClick={handleClose} />}>
                        Close
                    </Button>
                </Box>
                
                <Typography component="h2" variant="h2">
                    Delete user - {user}
                </Typography>

                <Typography variant="body2" sx={{ mt: 2 }}>
                    Are you are about to delete a user, would you like to continue?
                </Typography>

                <Grid mt={4} display="flex" alignItems="center">
                    <Button variant="contained" color="primary" sx={{ mr: 2 }}>Yes</Button>
                    <Button variant="contained" color="primary">No</Button>
                </Grid>
            </Box>
        </Box>
    )
}

export default DeleteUserDrawer;