import { Box, Grid, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom/cjs/react-router-dom.min';
import { useGlobalEnvironmentsState, useGlobalEnvironmentState } from '../../components/EnviromentDropdown';
import { useGetMyAccessGroups } from '../../graphql/getMyAccessGroups';

export default function MiddleColumn() {
    // Local state
    const [accessGroups, setAccessGroups] = useState([]);

    // Global state
    const Environments = useGlobalEnvironmentsState();
    const Environment = useGlobalEnvironmentState();

    // Router
    let history = useHistory();

    // Custom Hooks
    const getAccessGroups = useGetMyAccessGroupsHook(setAccessGroups);

    useEffect(() => {
        getAccessGroups();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Grid item sx={{ flex: 1, display: 'flex', justifyContent: 'center', flexDirection: 'column', maxWidth: '300px', minWidth: '220px' }} mb={2}>
            <Typography component="h3" variant="h3" color="text.primary">
                Belongs to environments
            </Typography>

            <Box mt="1.31rem">
                {Environments.get().length ? (
                    Environments.get().map((env) => (
                        <Grid display="flex" mt={1.5} mb={1.5} alignItems="center" key={env.id}>
                            <Typography
                                onClick={() => history.push(`/settings/environment/${env.id}`)}
                                sx={{ cursor: 'pointer' }}
                                variant="subtitle2"
                                lineHeight="15.23px"
                                color="primary">
                                {env.name}
                            </Typography>
                        </Grid>
                    ))
                ) : (
                    <Typography variant="subtitle2" lineHeight="15.23px">
                        None
                    </Typography>
                )}
            </Box>

            <Box mt="2.31rem">
                <Typography component="h3" variant="h3" color="text.primary">
                    Belongs to access groups
                </Typography>

                <Box mt="1.31rem">
                    {accessGroups.filter((env) => env.EnvironmentID === Environment.id.get()).length ? (
                        accessGroups
                            .filter((env) => env.EnvironmentID === Environment.id.get())
                            .map((env) => (
                                <Grid display="flex" mt={1.5} mb={1.5} alignItems="center" key={env.AccessGroupID}>
                                    <Typography
                                        onClick={() => history.push(`/access/${env.AccessGroupID}`)}
                                        sx={{ cursor: 'pointer' }}
                                        variant="subtitle2"
                                        lineHeight="15.23px"
                                        color="primary">
                                        {env.Name ? env.Name : 'None'}
                                    </Typography>
                                </Grid>
                            ))
                    ) : (
                        <Typography variant="subtitle2" lineHeight="15.23px">
                            None
                        </Typography>
                    )}
                </Box>
            </Box>
        </Grid>
    );
}

// Custom hooks
const useGetMyAccessGroupsHook = (setAccessGroups) => {
    // GraphQL hook
    const getMyAccessGroups = useGetMyAccessGroups();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get access groups
    return async () => {
        const response = await getMyAccessGroups();

        if (response === null) {
            setAccessGroups([]);
        } else if (response.r || response.error) {
            closeSnackbar();
            enqueueSnackbar("Can't get access groups: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setAccessGroups(response);
        }
    };
};
