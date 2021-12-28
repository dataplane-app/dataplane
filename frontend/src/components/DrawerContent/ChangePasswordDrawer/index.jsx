import {useState} from 'react'
import { Box, Typography, Button, Grid, TextField } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { useUpdateChangeMyPassword } from "../../../graphql/updateChangeMyPassword";
import { useSnackbar } from 'notistack';

const ChangePasswordDrawer = ({handleClose}) => {
    // GraphQL hook
    const updateChangeMyPassword = useUpdateChangeMyPassword();

    // State
    const [password, setPassword] = useState(null)

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Submit new password
    const handleSubmit =  async () => {
        let response = await updateChangeMyPassword({ password })
        if (response === 'success') {
            closeSnackbar()
            enqueueSnackbar(`Success`, { variant: "success" })
            handleClose()
        }else{
            if (response.errors) {
              response.errors.map(err => enqueueSnackbar(err.message, { variant: "error" }))
            }
            if (response.r === 'error') {
                enqueueSnackbar(response.msg, { variant: "error" })
            }
        }
    }

    return (
        <Box position="relative">
            <Box sx={{ p: "4.125rem" }}>

                <Box position="absolute" top="26px" right="39px" display="flex" alignItems="center">
                    <Button variant="text" onClick={handleClose} style={{ paddingLeft: "16px", paddingRight: "16px"}} startIcon={<FontAwesomeIcon icon={faTimes} />}>
                        Close
                    </Button>
                </Box>
                
                <Typography component="h2" variant="h2">
                    Change password
                </Typography>

                <Grid mt={3.4} display="flex" alignItems="center">
                    <TextField
                        onChange={(e) => setPassword(e.target.value)}
                        label="New password"
                        id="new_password"
                        size="small"
                    />
                    <Button  onClick={handleSubmit} variant="contained" color="primary" height="100%" sx={{ ml: 1 }} >Submit</Button>
                </Grid>
            </Box>
        </Box>
    )
}

export default ChangePasswordDrawer;