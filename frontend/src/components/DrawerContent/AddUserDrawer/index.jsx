import { Box, Typography, Button, Grid, TextField } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { useForm } from "react-hook-form";
import { useCreateUser } from "../../../graphql/createUser";
import { useSnackbar } from 'notistack';

const AddUserDrawer = ({ handleClose }) => {
    const createUser = useCreateUser();
    const { enqueueSnackbar } = useSnackbar();
    const { register, handleSubmit, watch, formState: { errors } } = useForm();

    async function onSubmit(data){
        const allData = {
            input: {
                first_name: data.first_name,
				last_name: data.last_name,
				email: data.email,
				job_title: data.job_title,
				password: data.password,
				timezone: "GMT+3",
                environmentID: "10"
            }
        }

        let response = await createUser(allData)
        if(response && response.user_id){
            handleClose()
        }else{
            response.errors.map(err => {
                enqueueSnackbar(err.message, { variant: "error" });
            })
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>

        <Box position="relative" style={{maxWidth: "400px", margin: "auto", marginTop: 0}}>
            <Box sx={{ p: "4.125rem" }}>

                <Box position="absolute" top="26px" right="39px" display="flex" alignItems="center">
                    <Button onClick={handleClose}  variant="text" startIcon={<FontAwesomeIcon icon={faTimes}/>}>
                        Close
                    </Button>
                </Box>
                
                <Typography component="h2" variant="h2">
                    Add user
                </Typography>

                <Typography variant="body2" sx={{ mt: 2 }}>
                    This will add a team member to the Production environment.
                </Typography>

                <TextField
                    label="First name"
                    id="first_name"
                    size="small"
                    required
                    sx={{ mt: 2, mb: 2, fontSize: ".75rem", display: "flex", background: "white" }}
                    {...register("first_name", { required: true })}
                />
                <TextField
                    label="Last name"
                    id="last_name"
                    size="small"
                    required
                    sx={{ mb: 2, fontSize: ".75rem", display: "flex", background: "white"  }}
                    {...register("last_name", { required: true })}
                />
                <TextField
                    label="Email"
                    id="email"
                    type="email"
                    size="small"
                    required
                    sx={{ mb: 2,fontSize: ".75rem", display: "flex", background: "white"  }}
                    {...register("email", { required: true })}
                />
                <TextField
                    label="Password"
                    id="password"
                    type="password"
                    size="small"
                    required
                    sx={{ fontSize: ".75rem", display: "flex", background: "white"  }}
                    {...register("password", { required: true })}
                />

                <Typography variant="body2" sx={{ mt: 2 }}>
                    The user will be asked to change password on first login.
                </Typography>

                <TextField
                    label="Job title"
                    id="job_title"
                    size="small"
                    sx={{ mt: 2, fontSize: ".75rem", display: "flex", background: "white"  }}
                    {...register("job_title")}
                />
                <TextField
                    label="Timezone"
                    id="timezone"
                    size="small"
                    sx={{ mt: 2, fontSize: ".75rem", display: "flex", background: "white" }}
                    {...register("timezone")}
                />

                <Grid mt={4} display="flex" alignItems="center">
                    <Button type="submit" variant="contained" color="primary" style={{width:"100%"}}>Save</Button>
                </Grid>
            </Box>
        </Box>
        </form>

    )
}

export default AddUserDrawer;