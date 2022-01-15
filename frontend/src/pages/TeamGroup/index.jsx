import { Box, Grid, Typography } from '@mui/material';
import { useState } from 'react';
import Details from './Details';
import Drawers from './Drawers';
import Permissions from './Permissions';
import Members from './Members';

const TeamGroup = () => {
    const [isActive] = useState(true);
    const [isAdmin] = useState(true);

    return (
        <Box className="page" width="83%">
            <Grid container alignItems="center">
                <Typography component="h2" variant="h2" color="text.primary">
                    Team {'>'} Access group {'>'} Data engineering team
                </Typography>
            </Grid>

            <Grid container mt="2.56rem" alignItems="flex-start" justifyContent="space-between">
                <Grid item sx={{ flex: 1 }}>
                    <Details />
                    <Drawers />
                </Grid>
                <Grid item sx={{ flex: 2.2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <Permissions />
                </Grid>
                <Grid item sx={{ flex: 1 }}>
                    <Members />
                </Grid>
            </Grid>
        </Box>
    );
};

export default TeamGroup;
