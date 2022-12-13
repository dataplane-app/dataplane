import { Box, Grid, Button, Typography } from '@mui/material';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import Control from './Control';
import Details from './Details';
import Environments from './Environments';
import Packages from './Packages';
import { useSnackbar } from 'notistack';
import { useGetSingleRemoteProcessGroup } from '../../../../graphql/getSingleRemoteProcessGroup';
import { useHistory, useParams } from 'react-router-dom';
import { useGlobalEnvironmentState } from '../../../../components/EnviromentDropdown';

export default function RemoteProcessGroupManage() {
    const [remoteProcessGroup, setRemoteProcessGroup] = useState(null);

    // Global environment state with hookstate
    const Environment = useGlobalEnvironmentState();

    const [remoteEnvironments, setRemoteEnvironments] = useState([]);

    // Graphql Hook
    const getSingleRemoteProcessGroup = useGetSingleRemoteProcessGroupHook(Environment.id.get(), setRemoteProcessGroup);

    useEffect(() => {
        if (!Environment.id.get()) return;

        getSingleRemoteProcessGroup();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Environment.id.get()]);

    const history = useHistory();

    return (
        <Box className="page" width="100%">
            <Grid container alignItems="center">
                <Typography component="h2" variant="h2" color="text.primary">
                    Process group {'> ' + remoteProcessGroup?.name}
                </Typography>
                <Button
                    onClick={() => history.push('/remote/processgroups')}
                    style={{ paddingLeft: '16px', paddingRight: '16px', marginLeft: 'auto' }}
                    variant="text"
                    startIcon={<FontAwesomeIcon icon={faTimes} />}>
                    Close
                </Button>
            </Grid>

            <Grid container mt="2.56rem" alignItems="flex-start" gap="5%" justifyContent="flex-start" flexWrap="nowrap">
                {/* Details */}
                {remoteProcessGroup && Environment.id.get() ? (
                    <Grid item minWidth="250px" width="250px" mb={2}>
                        <Details environmentId={Environment.id.get()} remoteProcessGroup={remoteProcessGroup} getSingleRemoteProcessGroup={getSingleRemoteProcessGroup} />

                        <Box sx={{ margin: '2.45rem 0', borderTop: 1, borderColor: 'divider' }}></Box>

                        <Control environmentId={Environment.id.get()} remoteProcessGroup={remoteProcessGroup} getSingleRemoteProcessGroup={getSingleRemoteProcessGroup} />
                    </Grid>
                ) : null}

                {/* Environments */}
                {Environment.id.get() ? (
                    <Grid item xs={3} minWidth="fit-content" sx={{ flex: 1, display: 'flex', justifyContent: 'center', flexDirection: 'column' }} mb={2}>
                        <Environments environmentId={Environment.id.get()} remoteEnvironments={remoteEnvironments} setRemoteEnvironments={setRemoteEnvironments} />
                    </Grid>
                ) : null}

                {/* Packages */}
                <Grid item xs={4} sx={{ flex: 1 }}>
                    {remoteProcessGroup && Environment.id.get() ? (
                        <Packages remoteProcessGroup={remoteProcessGroup} getSingleRemoteProcessGroup={getSingleRemoteProcessGroup} />
                    ) : null}
                </Grid>
            </Grid>
        </Box>
    );
}

// ** Custom Hooks
const useGetSingleRemoteProcessGroupHook = (environmentID, setRemoteProcessGroup) => {
    // GraphQL hook
    const getSingleRemoteProcessGroup = useGetSingleRemoteProcessGroup();

    const { enqueueSnackbar } = useSnackbar();

    const { groupId } = useParams();

    // Get worker groups
    return async () => {
        const response = await getSingleRemoteProcessGroup({ environmentID, remoteProcessGroupID: groupId });

        if (response.r || response.error) {
            enqueueSnackbar("Can't get remote process group: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setRemoteProcessGroup(response);
        }
    };
};
