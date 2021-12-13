import { TextField, Typography, Box, Grid, Button } from "@mui/material";
import { useState } from "react";
import CustomInput from "../CustomInput";
import ThemeToggle from "../ThemeToggle";
import CustomSwitch from "../CustomSwitch"
import { useForm } from "react-hook-form";
import { useCreateAdmin } from "../../graphql/createAdmin";

const GetStartedForm = ({ handleNext }) => {
    const createAdmin = useCreateAdmin();
    const { register, handleSubmit, watch, formState: { errors } } = useForm();
    
    async function onSubmit(data){
        console.log(data)

        const allData = {
            platform: {
                business_name: data.business_name,
                timezone: "GMT+2",
                complete: false
            },
            users: {
                first_name: data.first_name,
				last_name: data.last_name,
				email: data.email,
				job_title: data.job_title,
				password: data.password,
				timezone: "GMT+3",
            }
        }

        let response = await createAdmin(allData)
        console.log("RESPONSE", response)
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ mt: 3, mb: 3 }} display="block">
                <Typography component="h3" variant="h2" color="text.primary">Business</Typography>
                <TextField
                    label="Business name"
                    id="business_name"
                    size="small"
                    required
                    sx={{ mt: 2, mb: 2, fontSize: ".75rem", display: "flex" }}
                    {...register("business_name", { required: true })}
                />

                {errors.businessName && <Typography variant="subtitle1" color="danger" mt={1}>This field is required</Typography>}

            </Box>

            <Box sx={{ mt: 6, mb: 3 }} display="block">
                <Typography component="h3" variant="h2" color="text.primary">Admin user</Typography>
                <TextField
                    label="First name"
                    id="first_name"
                    size="small"
                    required
                    sx={{ mt: 2, mb: 2, fontSize: ".75rem", display: "flex" }}
                    {...register("first_name", { required: true })}
                />
                <TextField
                    label="Last name"
                    id="last_name"
                    size="small"
                    required
                    sx={{ mb: 2, fontSize: ".75rem", display: "flex" }}
                    {...register("last_name", { required: true })}
                />
                <TextField
                    label="Email"
                    id="email"
                    type="email"
                    size="small"
                    required
                    sx={{ mb: 2,fontSize: ".75rem", display: "flex" }}
                    {...register("email", { required: true })}
                />
                <TextField
                    label="Job title"
                    id="job_title"
                    size="small"
                    required
                    sx={{ mb: 2, fontSize: ".75rem", display: "flex" }}
                    {...register("job_title", { required: true })}
                />
                <TextField
                    label="Password"
                    id="password"
                    type="password"
                    size="small"
                    required
                    sx={{ fontSize: ".75rem", display: "flex" }}
                    {...register("password", { required: true })}
                />
            </Box>

            <Grid container alignItems="center" justifyContent="center">
                <CustomSwitch />
                <Typography ml="1.5rem" variant="subtitle2" color="text.primary" fontSize={14}>
                    Mode <Typography display="block" variant="subtitle2" fontSize={14}>preference</Typography>
                </Typography>
            </Grid>

            <Box sx={{ mt: "37px" }}>
                <Button variant="contained" type="submit" color="primary" sx={{ width: "100%" }}>Next</Button>
            </Box>
        </form>
    );
};

export default GetStartedForm;
