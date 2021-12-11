import { useState, useEffect } from 'react';
import Lottie from "react-lottie";
import Loader from '../../assets/animations/spinner.json'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons'
import { useNavigate } from 'react-router-dom'
import { Box } from '@mui/system';
import { Grid, Typography } from '@mui/material';

const SetupLoader = () => {
    let navigate = useNavigate();

    const [isSettingProfile, setIsSettingProfile] = useState(true);
    const [isCreatingEnv, setIsCreatingEnv] = useState(true);
    const [isCreatingAdmin, setIsCreatingAdmin] = useState(true);

    useEffect(() => {
        const settingProfile = window.setTimeout(() => {
            setIsSettingProfile(false);
        }, 1000);

        const creatingEnv = window.setTimeout(() => {
            setIsCreatingEnv(false);
        }, 2000);
    
        const isCreatingAdmin = window.setTimeout(() => {
            setIsCreatingAdmin(false);
        }, 3000); 

        const goToCongrats = window.setTimeout(() => {
            navigate('/congratulations')
        }, 3300)
    
        return () => {
            window.clearTimeout(settingProfile);
            window.clearTimeout(creatingEnv);
            window.clearTimeout(isCreatingAdmin);
            window.clearTimeout(goToCongrats);
        };
    }, []);

    return(
        <>
        <Box mt="1.5rem">
            <Grid container alignItems="center">
                <Box sx={{ width: "2.75rem" }}>
                {
                    isSettingProfile ?
                    <Box
                        component={Lottie}
                        options={{
                            animationData: Loader,
                            autoplay: true,
                        }}
                        loop
                        fontSize="1.875rem"
                        /> : <Box component={FontAwesomeIcon} sx={{ fontSize: "2rem", color: "#70AD46" }} icon={faCheckCircle} />
                }
                </Box>
                <Typography sx={{ ml: 2 }} color="text.primary">Setting business profile</Typography>
            </Grid>
        </Box>

        <Box mt="1.5rem">
            <Grid container alignItems="center">
                <Box sx={{ width: "2.75rem" }}>
                {
                    isCreatingEnv ?
                    <Box
                        component={Lottie}
                        options={{
                            animationData: Loader,
                            autoplay: true,
                        }}
                        loop
                        fontSize="1.875rem"
                        /> : <Box component={FontAwesomeIcon} sx={{ fontSize: "2rem", color: "#70AD46", mr: 2 }} icon={faCheckCircle} />
                }
                </Box>
                <Typography sx={{ ml: 2 }} color="text.primary" >Creating environments</Typography>
            </Grid>
        </Box>

        <Box mt="1.5rem">
            <Grid container alignItems="center">
                <Box sx={{ width: "2.75rem" }}>
                {
                    isCreatingAdmin ?
                    <Box
                        component={Lottie}
                        options={{
                            animationData: Loader,
                            autoplay: true,
                        }}
                        loop
                        fontSize="1.7rem"
                        /> : <Box component={FontAwesomeIcon} sx={{ fontSize: "2rem", color: "#70AD46" }} icon={faCheckCircle} />
                }
                </Box>
                <Typography sx={{ ml: 2 }} color="text.primary" >Creating admin user</Typography>
            </Grid>
        </Box>
        </>
    )
}

export default SetupLoader;