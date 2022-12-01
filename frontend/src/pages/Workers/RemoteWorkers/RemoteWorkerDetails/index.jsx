import { Box, Button, Grid, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import ProcessGroups from './ProcessGroups';
import Control from './Control';
import Details from './Details';
import { useHistory, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useGlobalEnvironmentState } from '../../../../components/EnviromentDropdown';
import { useSnackbar } from 'notistack';
import { useGetSingleRemoteWorker } from '../../../../graphql/getSingleRemoteWorker';

export default function RPAManage() {
    const [remoteWorker, setRemoteWorker] = useState(null);

    // Global environment state with hookstate
    const Environment = useGlobalEnvironmentState();

    // Graphql Hook
    const getSingleRemoteWorker = useGetSingleRemoteWorkerHook(Environment.id.get(), setRemoteWorker);

    useEffect(() => {
        getSingleRemoteWorker();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Environment.id.get()]);

    const history = useHistory();

    return (
        <Box className="page" width="83%">
            <Grid container alignItems="center">
                <Typography component="h2" variant="h2" color="text.primary">
                    RPA Workers {'> ' + remoteWorker?.workerName}
                </Typography>

                <Button
                    onClick={() => history.push('/remote/workers')}
                    style={{ paddingLeft: '16px', paddingRight: '16px', marginLeft: 'auto' }}
                    variant="text"
                    startIcon={<FontAwesomeIcon icon={faTimes} />}>
                    Close
                </Button>
            </Grid>

            <Grid container mt="2.56rem" alignItems="flex-start" gap="5%" justifyContent="space-between" flexWrap="nowrap">
                {remoteWorker ? (
                    <Grid item minWidth="250px" width="250px" mb={2}>
                        <Details environmentId={'Production'} remoteWorker={remoteWorker} getSingleRemoteWorker={getSingleRemoteWorker} />

                        <Box sx={{ margin: '2.45rem 0', borderTop: 1, borderColor: 'divider' }}></Box>

                        <Control environmentId={'Production'} remoteWorker={remoteWorker} getSingleRemoteWorker={getSingleRemoteWorker} />
                    </Grid>
                ) : null}

                <Grid item sx={{ flex: 1, display: 'flex', justifyContent: 'center', flexDirection: 'column' }} mb={2}>
                    <ProcessGroups environmentId={Environment.id.get()} />
                </Grid>
            </Grid>
        </Box>
    );
}

// ** Custom Hooks
const useGetSingleRemoteWorkerHook = (environmentID, setRemoteWorker) => {
    // GraphQL hook
    const getSingleRemoteWorker = useGetSingleRemoteWorker();

    const { enqueueSnackbar } = useSnackbar();

    const { workerId } = useParams();

    // Get worker groups
    return async () => {
        const response = await getSingleRemoteWorker({ environmentID, workerID: workerId });

        if (response.r || response.error) {
            enqueueSnackbar("Can't get remote worker: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setRemoteWorker(response);
        }
    };
};
