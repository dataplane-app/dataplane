import { Box, Grid, Typography } from '@mui/material';
import { useState, useEffect } from 'react';
import Details from './Details';
import Drawers from './Drawers';
import Permissions from './Permissions';
import Members from './Members';
import { useGlobalMeState } from '../../components/Navbar';
import { useGlobalEnvironmentState } from '../../components/EnviromentDropdown';

const TeamGroup = () => {
    // Global user states
    const MeData = useGlobalMeState();
    const EnvironmentID = useGlobalEnvironmentState();

    // Local state
    const [isGlobalDataLoaded, setIsGlobalDataLoaded] = useState(false);
    const [name, setName] = useState('');

    // Check if global data is loaded
    useEffect(() => {
        if (EnvironmentID.get() && MeData.get()) {
            setIsGlobalDataLoaded(true);
        }
    }, [EnvironmentID, MeData]);

    return (
        <Box className="page" width="83%">
            <Grid container alignItems="center">
                <Typography component="h2" variant="h2" color="text.primary">
                    Team {'>'} Access group {'>'} {name}
                </Typography>
            </Grid>

            {isGlobalDataLoaded ? (
                <Grid container mt="2.56rem" alignItems="flex-start" justifyContent="space-between">
                    <Grid item sx={{ flex: 1 }}>
                        <Details userId={MeData.user_id.get()} environmentId={EnvironmentID.get()} setName={setName} />
                        <Drawers />
                    </Grid>
                    <Grid item sx={{ flex: 2.2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                        <Permissions />
                    </Grid>
                    <Grid item sx={{ flex: 1 }}>
                        <Members />
                    </Grid>
                </Grid>
            ) : null}
        </Box>
    );
};

export default TeamGroup;
