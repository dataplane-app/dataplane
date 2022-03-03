import { Box, Grid, Typography, TextField, MenuItem, Button, Drawer } from '@mui/material';
import Search from '../components/Search';
import CustomChip from '../components/CustomChip';
import PipelineTable from '../components/TableContent/PipelineTable';
import MoreInfoMenu from '../components/MoreInfoMenu';
import PipelinePageItem from '../components/MoreInfoContent/PipelinePageItem';
import { useGlobalEnvironmentState } from '../components/EnviromentDropdown';
import AddPipelineDrawer from '../components/DrawerContent/AddPipelineDrawer';
import { useGetPipelines } from '../graphql/getPipelines';
import { useEffect, useRef, useState } from 'react';
import { useSnackbar } from 'notistack';
import { useGlobalFlowState } from './Flow';
import { useGlobalRunState } from './View/useWebSocket';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

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

    // Ref for scroll to top
    const scrollRef = useRef(null);

    // Custom GraphQL hook
    const getPipelines = useGetPipelines_(setPipelines, Environment.id.get());

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
        RunState.set({});
        scrollRef.current.parentElement.scrollIntoView();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Environment.id.get()]);

    return (
        <Box className="page" position="relative" ref={scrollRef}>
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

                    <Box display="flex" alignItems="center">
                        <Box sx={{ position: { xxs: 'relative', xl: 'absolute' }, ml: { xxs: 2, xl: 0 }, top: '0', right: '0' }}>
                            <MoreInfoMenu>
                                <PipelinePageItem handleRefresh={() => {}} />
                            </MoreInfoMenu>
                        </Box>
                    </Box>
                </Grid>

                <Grid container mt={4} direction="row" alignItems="center" justifyContent="flex-start">
                    <Grid item display="flex" alignItems="center" sx={{ alignSelf: 'center', width: '100%' }}>
                        <CustomChip amount={pipelineCount || '0'} label="Pipelines" margin={1} customColor="orange" />

                        <FontAwesomeIcon icon={faSearch} style={{ marginRight: 10, marginLeft: 25 }} color="#0000006B" size="xs" />

                        <Search placeholder="Find a pipeline" onChange={(e) => setFilter(e)} width="290px" />

                        <Button variant="contained" sx={{ marginLeft: 'auto' }} onClick={() => setIsOpenCreatePipeline(true)}>
                            Create
                        </Button>
                    </Grid>

                    <PipelineTable data={pipelines} filter={filter} setPipelineCount={setPipelineCount} environmentID={Environment.id.get()} />
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

function useGetPipelines_(setPipelines, environmentID) {
    // GraphQL hook
    const getPipelines = useGetPipelines();

    const { enqueueSnackbar } = useSnackbar();

    // Get pipelines
    return async () => {
        const response = await getPipelines({ environmentID });

        if (response.r === 'error') {
            enqueueSnackbar("Can't get pipelines: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': get pipelines', { variant: 'error' }));
        } else {
            setPipelines(response);
        }
    };
}
