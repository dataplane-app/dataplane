import { Box, Grid, Typography, Button, Drawer } from '@mui/material';
import Search from '../../components/Search/index.jsx';
import CustomChip from '../../components/CustomChip/index.jsx';
import PipelineTable from '../../components/TableContent/PipelineTable/index.jsx';
import { useGlobalEnvironmentState } from '../../components/EnviromentDropdown/index.jsx';
import AddPipelineDrawer from './Components/Drawers/AddPipelineDrawer/index.jsx';
import { useGetPipelines } from '../../graphql/pipelines/getPipelines.js';
import { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import { useGlobalFlowState } from './PipelineEdit.jsx';
import { useGlobalRunState } from '../PipelineRuns/GlobalRunState.jsx';

const Pipelines = () => {
    // Global states
    const Environment = useGlobalEnvironmentState();
    const FlowState = useGlobalFlowState();
    const RunState = useGlobalRunState();

    // Drawer state
    const [isOpenCreatePipeline, setIsOpenCreatePipeline] = useState(false);

    // Local state
    const [pipelines, setPipelines] = useState([]);
    const [filter, setFilter] = useState();
    const [pipelineCount, setPipelineCount] = useState();

    // Custom GraphQL hook
    const getPipelines = useGetPipelinesHook(setPipelines, Environment.id.get());

    // Get pipelines and clear flow state on load and when environment changes
    useEffect(() => {
        if (Environment.id.get() === '') return;
        getPipelines();
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

        RunState.set({
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
                            Pipelines
                        </Typography>

                        <Typography variant="subtitle2" mt=".20rem">
                            Environment: {Environment.name.get()}
                        </Typography>
                    </Box>
                </Grid>

                <Grid container mt={4} direction="row" alignItems="center" justifyContent="flex-end">
                    <Grid item display="flex" alignItems="center" sx={{ alignSelf: 'center', width: '100%' }}>
                        <CustomChip amount={pipelineCount || '0'} label="Pipelines" margin={1} customColor="orange" style={{ marginRight: 25 }} />

                        <Search placeholder="Find a pipeline" onChange={(e) => setFilter(e)} width="290px" />

                        <Button variant="contained" sx={{ marginLeft: 'auto' }} onClick={() => setIsOpenCreatePipeline(true)}>
                            Create
                        </Button>
                    </Grid>

                    <PipelineTable data={pipelines} filter={filter} setPipelineCount={setPipelineCount} environmentID={Environment.id.get()} setPipelines={setPipelines} />
                </Grid>
            </Box>

            <Drawer anchor="right" open={isOpenCreatePipeline} onClose={() => setIsOpenCreatePipeline(!isOpenCreatePipeline)}>
                <AddPipelineDrawer
                    environmentID={Environment.id.get()}
                    handleClose={() => {
                        setIsOpenCreatePipeline(false);
                    }}
                />
            </Drawer>
        </Box>
    );
};

export default Pipelines;

// ---------- Custom Hook

function useGetPipelinesHook(setPipelines, environmentID) {
    // GraphQL hook
    const getPipelines = useGetPipelines();

    const { enqueueSnackbar } = useSnackbar();

    // Get pipelines
    return async () => {
        const response = await getPipelines({ environmentID });

        if (response.r || response.error) {
            enqueueSnackbar("Can't get pipelines: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setPipelines(response);
        }
    };
}
