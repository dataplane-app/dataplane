import { Box, Grid, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useGlobalEnvironmentState } from '../../components/EnviromentDropdown';
import { useGetMyDeploymentPermissions } from '../../graphql/getMyDeploymentPermissions';
import { useMyPermissions } from '../../graphql/getMyPermissions';
import { useGetMyPipelinePermissions } from '../../graphql/getMyPipelinePermissions';
import { formatSpecialPermission } from '../../utils/formatString';

export default function RightColumn() {
    // Global state
    const Environment = useGlobalEnvironmentState();

    // Member states
    const [userPermissions, setUserPermissions] = useState([]);
    const [userSpecificPermissions, setUserSpecificPermissions] = useState([]);

    // Custom Hooks
    const getMyPermissions = useMyPermissionsHook(setUserPermissions);
    const getMyPipelinePermissions = useGetMyPipelinePermissionsHook(setUserSpecificPermissions);

    useEffect(() => {
        getMyPermissions();
        getMyPipelinePermissions();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Grid item sx={{ flex: 1 }}>
            <Box>
                <Box>
                    <Typography component="h3" variant="h3" color="text.primary">
                        Platform permissions
                    </Typography>
                </Box>

                {/* Platform permissions */}
                <Box mt={2} id="platform-permissions">
                    {userPermissions
                        ?.filter((permission) => permission.Level === 'platform')
                        .map((permission) => (
                            <Grid display="flex" alignItems="center" key={permission.ID} mt={1.5} mb={1.5}>
                                <Typography variant="subtitle2" lineHeight="15.23px">
                                    {permission.Label}
                                </Typography>
                            </Grid>
                        ))}
                </Box>

                {/* Environment permissions */}
                {userPermissions.filter((permission) => permission.Level === 'environment' && permission.EnvironmentID === Environment.id.get()).length ? (
                    <Box mt="2.31rem">
                        <Typography component="h3" variant="h3" color="text.primary">
                            Environment permissions
                        </Typography>
                        <Typography variant="subtitle2" mt=".20rem">
                            Environment: {Environment.name.get()}
                        </Typography>

                        <Box mt={2}>
                            {userPermissions
                                ?.filter((permission) => permission.Level === 'environment' && permission.ResourceID === Environment.id.get())
                                .map((permission) => (
                                    <Grid display="flex" alignItems="center" key={permission.ID} mt={1.5} mb={1.5}>
                                        <Typography variant="subtitle2" lineHeight="15.23px">
                                            {permission.Label}
                                        </Typography>
                                    </Grid>
                                ))}
                        </Box>
                    </Box>
                ) : null}

                {/* Specific permissions */}
                {userSpecificPermissions.length ? (
                    <Box mt="2.31rem">
                        <Typography component="h3" variant="h3" color="text.primary">
                            Specific permissions
                        </Typography>

                        <Box mt={2}>
                            {userSpecificPermissions
                                ?.filter((permission) => permission.EnvironmentID === Environment.id.get())
                                .map((permission) => (
                                    <Grid display="flex" alignItems="center" width="200%" key={permission.ResourceID + permission.SubjectID} mt={1.5} mb={1.5}>
                                        <Typography variant="subtitle2" lineHeight="15.23px" pr={2}>
                                            {formatSpecialPermission(permission)}
                                        </Typography>
                                    </Grid>
                                ))}
                        </Box>
                    </Box>
                ) : null}
            </Box>
        </Grid>
    );
}

// --------- Custom hooks
const useMyPermissionsHook = (setUserPermissions) => {
    // GraphQL hook
    const getMyPermissions = useMyPermissions();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get my permissions
    return async () => {
        const response = await getMyPermissions();

        if (response === null) {
            setUserPermissions([]);
        } else if (response.r || response.error) {
            closeSnackbar();
            enqueueSnackbar("Can't get my permissions: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setUserPermissions(response);
        }
    };
};

const useGetMyPipelinePermissionsHook = (setUserSpecificPermissions) => {
    // GraphQL hook
    const getMyPipelinePermissions = useGetMyPipelinePermissions();
    const getMyDeploymentPermissions = useGetMyDeploymentPermissions();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get specific permissions
    return async () => {
        let responsePipeline = await getMyPipelinePermissions();

        if (responsePipeline === null) {
            responsePipeline = [];
        } else if (responsePipeline.r || responsePipeline.error) {
            closeSnackbar();
            enqueueSnackbar("Can't get specific permissions: " + (responsePipeline.msg || responsePipeline.r || responsePipeline.error), { variant: 'error' });
        } else if (responsePipeline.errors) {
            responsePipeline.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        }

        const responseDeployment = await getMyDeploymentPermissions();

        if (responseDeployment === null) {
            setUserSpecificPermissions(responsePipeline);
        } else if (responseDeployment.r || responseDeployment.error) {
            closeSnackbar();
            enqueueSnackbar("Can't get specific permissions: " + (responseDeployment.msg || responseDeployment.r || responseDeployment.error), { variant: 'error' });
        } else if (responseDeployment.errors) {
            responseDeployment.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setUserSpecificPermissions([...responsePipeline, ...responseDeployment]);
        }
    };
};
