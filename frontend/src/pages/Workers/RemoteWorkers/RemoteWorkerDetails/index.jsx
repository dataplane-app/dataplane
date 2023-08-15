import { Box, Button, Grid, Typography } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import ProcessGroups from './ProcessGroups';
import Control from './Control';
import Details from './Details';
import { useHistory, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useGlobalEnvironmentsState, useGlobalEnvironmentState } from '../../../../components/EnviromentDropdown';
import { useSnackbar } from 'notistack';
import { useGetSingleRemoteWorker } from '../../../../graphql/remoteworkers/getSingleRemoteWorker.js';
import ProcessGroupEnvironments from './Environments';
import { useGetRemoteProcessGroups } from '../../../../graphql/remoteworkers/getRemoteProcessGroups.js';
import { useGetRemoteWorkersProcessGroups } from '../../../../graphql/remoteworkers/getRemoteWorkersProcessGroups.js';

export default function RPAManage() {
    // Global environment state with hookstate
    const Environment = useGlobalEnvironmentState();
    const Environments = useGlobalEnvironmentsState();

    // Local state
    const [remoteWorker, setRemoteWorker] = useState(null);
    const [workerEnvironment, setWorkerEnvironment] = useState(null);
    const [workersProcessGroups, setWorkersProcessGroups] = useState([]);
    const [allRemoteProcessGroups, setAllRemoteProcessGroups] = useState([]);

    // Graphql Hooks
    const getSingleRemoteWorker = useGetSingleRemoteWorkerHook(Environment.id.get(), setRemoteWorker);
    const getRemoteProcessGroups = useGetRemoteProcessGroupsHook(Environment.id.get(), workerEnvironment?.id, setAllRemoteProcessGroups);
    const getRemoteWorkersProcessGroups = useGetRemoteWorkersProcessGroupsHook(workerEnvironment?.id, setWorkersProcessGroups);

    // UseEffect runs only on load
    const skip = useRef(false);
    useEffect(() => {
        if (!Environment.id.get() || skip.current) return;

        getSingleRemoteWorker();
        setWorkerEnvironment(Environments.get()[0]);
        skip.current = true;

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Environment.id.get()]);

    // Get worker's process groups on worker environment change
    useEffect(() => {
        if (!workerEnvironment?.id) return;

        getRemoteProcessGroups();
        getRemoteWorkersProcessGroups();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workerEnvironment?.id]);

    const history = useHistory();

    return (
        <Box className="page">
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
                        <Details environmentId={Environment.id.get()} remoteWorker={remoteWorker} getSingleRemoteWorker={getSingleRemoteWorker} />

                        <Box sx={{ margin: '2.45rem 0', borderTop: 1, borderColor: 'divider' }}></Box>

                        <Control environmentId={Environment.id.get()} remoteWorker={remoteWorker} getSingleRemoteWorker={getSingleRemoteWorker} />
                    </Grid>
                ) : null}

                <Grid item sx={{ flex: 1, display: 'flex', justifyContent: 'center', flexDirection: 'column', minWidth: '400px' }} mb={2}>
                    {workerEnvironment?.id ? (
                        <ProcessGroups
                            workerEnvironment={workerEnvironment}
                            setWorkerEnvironment={setWorkerEnvironment}
                            allRemoteProcessGroups={allRemoteProcessGroups}
                            workersProcessGroups={workersProcessGroups}
                            getRemoteWorkersProcessGroups={getRemoteWorkersProcessGroups}
                        />
                    ) : null}
                </Grid>

                <Grid item sx={{ flex: 1, display: 'flex', justifyContent: 'center', flexDirection: 'column' }} mb={2}>
                    <ProcessGroupEnvironments workersProcessGroups={workersProcessGroups} getRemoteWorkersProcessGroups={getRemoteWorkersProcessGroups} />
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

const useGetRemoteProcessGroupsHook = (environmentID, processGroupsEnvironmentID, setRemoteProcessGroups) => {
    // GraphQL hook
    const getRemoteProcessGroups = useGetRemoteProcessGroups();

    const { enqueueSnackbar } = useSnackbar();

    // Get worker groups
    return async () => {
        const response = await getRemoteProcessGroups({ environmentID, processGroupsEnvironmentID });

        if (response === null) {
            setRemoteProcessGroups([]);
        } else if (response.r || response.error) {
            enqueueSnackbar("Can't get remote process groups: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            // Convert string of environments to an array
            response.forEach((a) => (a.environments = a.environments.replace('{', '').replace('}', '').split(',')));
            setRemoteProcessGroups(response);
        }
    };
};

const useGetRemoteWorkersProcessGroupsHook = (environmentID, setWorkersProcessGroups) => {
    // GraphQL hook
    const getRemoteWorkersProcessGroups = useGetRemoteWorkersProcessGroups();

    const { workerId } = useParams();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    if (!environmentID) return;
    // Get environments on load
    return async () => {
        const response = await getRemoteWorkersProcessGroups({ environmentID, workerID: workerId });

        if (response.r || response.error) {
            closeSnackbar();
            enqueueSnackbar("Can't get process groups: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setWorkersProcessGroups(response);
        }
    };
};
