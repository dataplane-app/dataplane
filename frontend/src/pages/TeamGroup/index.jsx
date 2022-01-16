import { Box, Grid, Typography } from '@mui/material';
import { useState, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { useParams } from 'react-router-dom';
import { useGlobalMeState } from '../../components/Navbar';
import { useGlobalEnvironmentState } from '../../components/EnviromentDropdown';
import { useGetAccessGroup } from '../../graphql/getAccessGroup';
import Details from './Details';
import Control from './Control';
import Permissions from './Permissions';
import Members from './Members';

const TeamGroup = () => {
    // Global user states with hookstate
    const MeData = useGlobalMeState();
    const Environment = useGlobalEnvironmentState();

    // Local state
    const [isGlobalDataLoaded, setIsGlobalDataLoaded] = useState(false);
    const [accessGroup, setAccessGroup] = useState('');

    // URI parameter
    const { accessId } = useParams();

    // Custom Hook
    const getAccessGroup = useGetAccessGroup_(Environment.id.get(), MeData.user_id.get(), accessId, setAccessGroup);

    // Check if global data is loaded
    useEffect(() => {
        if (Environment.id.get() && MeData.get()) {
            setIsGlobalDataLoaded(true);
            // getAccessGroup();
        }
    }, [Environment, MeData]);

    // Get access group data on load
    useEffect(() => {
        getAccessGroup();
    }, []);

    return (
        <Box className="page" width="83%">
            <Grid container alignItems="center">
                <Typography component="h2" variant="h2" color="text.primary">
                    Team {'>'} Access group {'>'} {accessGroup.Name}
                </Typography>
            </Grid>

            {isGlobalDataLoaded && accessGroup ? (
                <Grid container mt="2.56rem" alignItems="flex-start" justifyContent="space-between">
                    <Grid item sx={{ flex: 1 }}>
                        <Details environmentId={Environment.id.get()} accessGroup={accessGroup} getAccessGroup={getAccessGroup} />

                        <Box sx={{ margin: '2.45rem 0', borderTop: 1, borderColor: 'divider' }}></Box>

                        <Control environmentId={Environment.id.get()} accessGroup={accessGroup} getAccessGroup={getAccessGroup} />
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

// ----------- Custom Hooks

const useGetAccessGroup_ = (environmentID, userID, access_group_id, setAccessGroup) => {
    // GraphQL hook
    const getAccessGroup = useGetAccessGroup();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get access group data
    return async () => {
        const response = await getAccessGroup({ environmentID, userID, access_group_id });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get access group data: " + response.msg, {
                variant: 'error',
            });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setAccessGroup(response);
        }
    };
};
