import { Box, Grid, Typography } from '@mui/material';
import Search from '../../components/Search';
import CustomChip from '../../components/CustomChip';
import { useGlobalEnvironmentState } from '../../components/EnviromentDropdown';
import { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import { useGetDeployments } from '../../graphql/getDeployments';
import DeploymentsTable from './DeploymentsTable';
import { useGlobalDeploymentState } from './DeploymentRuns/GlobalDeploymentState';
import { useGlobalPipelineRun } from '../PipelineRuns/GlobalPipelineRunUIState';

const Deployments = () => {
    // Global states
    const Environment = useGlobalEnvironmentState();
    const FlowState = useGlobalPipelineRun();
    const DeploymentState = useGlobalDeploymentState();

    // Local state
    const [deployments, setDeployments] = useState([]);
    const [filter, setFilter] = useState();
    const [pipelineCount, setPipelineCount] = useState();

    // Custom GraphQL hook
    const getDeployments = useGetDeploymentsHook(setDeployments, Environment.id.get());

    // Get deployments and clear flow state on load and when environment changes
    useEffect(() => {
        if (Environment.id.get() === '') return;
        getDeployments();
        FlowState.set({
            isRunning: false,
            isOpenSchedulerDrawer: false,
            isOpenConfigureDrawer: false,
            isOpenCommandDrawer: false,
            isOpenAPIDrawer: false,
            isEditorPage: false,
            selectedElement: null,
            elements: [],
            triggerDelete: 1,
        });

        DeploymentState.set({
            selectedRunID: null,
            runIDs: null,
            runTrigger: 0,
            onLoadTrigger: 0,
            onChangeTrigger: 0,
            node_id: null,
        });
        document.querySelector('#root div').scrollTo(0, 0);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Environment.id.get()]);

    return (
        <Box className="page" position="relative">
            <Box sx={{ width: { xl: '85%' } }}>
                <Grid container alignItems="center" justifyContent="space-between">
                    <Box>
                        <Typography component="h2" variant="h2" color="text.primary">
                            Deployments
                        </Typography>

                        <Typography variant="subtitle2" mt=".20rem">
                            Environment: {Environment.name.get()}
                        </Typography>
                    </Box>
                </Grid>

                <Grid container mt={4} direction="row" alignItems="center" justifyContent="flex-start">
                    <Grid item display="flex" alignItems="center" sx={{ alignSelf: 'center', width: '100%' }}>
                        <CustomChip amount={pipelineCount || '0'} label="Deployments" margin={1} customColor="orange" style={{ marginRight: 25 }} />

                        <Search placeholder="Find a deployment" onChange={(e) => setFilter(e)} width="290px" />
                    </Grid>

                    <DeploymentsTable data={deployments} filter={filter} setPipelineCount={setPipelineCount} environmentID={Environment.id.get()} setDeployments={setDeployments} />
                </Grid>
            </Box>
        </Box>
    );
};

export default Deployments;

// ---------- Custom Hook

function useGetDeploymentsHook(setDeployments, environmentID) {
    // GraphQL hook
    const getPipelines = useGetDeployments();

    const { enqueueSnackbar } = useSnackbar();

    // Get deployments
    return async () => {
        const response = await getPipelines({ environmentID });

        if (response.r || response.error) {
            enqueueSnackbar("Can't get deployments: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setDeployments(response);
        }
    };
}
