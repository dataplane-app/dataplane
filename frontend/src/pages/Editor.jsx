import { AppBar, Autocomplete, Box, Button, Grid, TextField, Toolbar, Typography } from '@mui/material';
import { Responsive, WidthProvider } from 'react-grid-layout';
import EditorColumn from '../components/EditorPage/EditorColumn';
import FileManagerColumn from '../components/EditorPage/FileManager';
import LogsColumn from '../components/EditorPage/LogsColumn';
import PackageColumn from '../components/EditorPage/PackagesColumn';
import Navbar, { useGlobalMeState } from '../components/Navbar';
import getGridLayouts from '../utils/editorLayouts';
import { createState, useState as useHookState } from '@hookstate/core';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import { useGlobalEnvironmentState } from '../components/EnviromentDropdown';
import { useSnackbar } from 'notistack';
import { useGetPipeline } from '../graphql/getPipeline';
import { useGetNode } from '../graphql/getNode';
import InstallationLogsColumn from '../components/EditorPage/InstallationLogsColumn';
import Markdown from '../components/EditorPage/Markdown';
import isMarkdown from '../utils/isMarkdown';
import useWindowSize from '../hooks/useWindowsSize';
import { useGetPipelineRuns } from '../graphql/getPipelineRuns';
import { formatDateNoZone } from '../utils/formatDate';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Global editor state

export const globalEditorState = createState({
    selectedFile: null,
    tabs: [],
    editor: null,
    currentPath: [],
    parentID: null,
    parentName: null,
    runID: null,
    runState: null,
    showLogs: false,
    markdown: 'view', // view or edit
});

export const useGlobalEditorState = () => useHookState(globalEditorState);

const PipelineEditor = () => {
    const Environment = useGlobalEnvironmentState();
    const MeData = useGlobalMeState();

    const { height } = useWindowSize();

    // Hooks
    const history = useHistory();
    const EditorGlobal = useGlobalEditorState();

    let currentTab = 'code';
    if (EditorGlobal.selectedFile?.id?.value === 'requirements.txt') {
        currentTab = 'install';
    }
    if (isMarkdown(EditorGlobal.selectedFile?.name?.value)) {
        currentTab = 'markdown';
    }

    const [pipeline, setPipeline] = useState({ replayGroup: 'A', replayType: 'Pipeline', replayRunID: '' });

    // Packages state for packages component
    const [packages, setPackages] = useState('');

    // Replay state
    const [runs, setRuns] = useState([]);
    const [selectedReplayRun, setSelectedReplayRun] = useState('');

    // Custom hook
    const getPipelineRuns = useGetPipelineRunsHook(Environment.id.get(), setRuns, setSelectedReplayRun, setPipeline);

    const getPipeline = useGetPipelineHook(Environment.id.get(), setPipeline);

    const editorRef = useRef(null);

    const handleUnload = () => {
        console.log('Still editing');
    };

    useEffect(() => {
        if (!Environment.id.get()) return;
        window.addEventListener('beforeunload', handleUnload);

        getPipeline();
        getPipelineRuns();

        return () => window.removeEventListener('beforeunload', handleUnload);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Environment.id.get()]);

    const handleClose = () => {
        EditorGlobal.set({
            selectedFile: null,
            tabs: [],
            editor: null,
            currentPath: [],
            parentID: null,
            parentName: null,
            runID: null,
            runState: null,
            showLogs: false,
            markdown: 'view',
        });
        history.push(`/pipelines/view/${pipeline.pipelineID}`);
    };

    let showLogs = EditorGlobal.showLogs.get() || currentTab === 'install';

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <AppBar
                elevation={0}
                position="fixed"
                sx={{ zIndex: (theme) => theme.zIndex.drawer, background: (theme) => theme.palette.background.secondary, borderBottom: 1, borderColor: 'divider' }}>
                <Toolbar style={{ padding: 0 }}>
                    <Navbar />
                </Toolbar>
            </AppBar>
            <Toolbar />
            <Grid container alignItems="center" justifyContent="space-between" mt={5} mb={1} sx={{ pr: 2, pl: 2 }}>
                <Typography variant="h3">
                    Code {'>'} {pipeline?.name} {'>'} {pipeline?.nodeName}
                </Typography>

                <Typography sx={{ marginLeft: 'auto', mr: 1 }}>Replay</Typography>

                <Autocomplete
                    id="replay_select"
                    onChange={(event, newValue) => setPipeline((p) => ({ ...p, replayType: newValue }))}
                    value={pipeline.replayType}
                    sx={{ minWidth: '120px', mr: 2, '.MuiAutocomplete-inputRoot': { height: '40px' } }}
                    disableClearable
                    options={['Pipeline', 'Code editor']}
                    renderInput={(params) => (
                        <TextField //
                            {...params}
                            id="replay_select_textfield"
                            size="small"
                            sx={{ display: 'flex', '& div input': { fontSize: '0.75rem' } }}
                        />
                    )}
                />

                <Typography sx={{ mr: 1 }}>Run ID</Typography>

                {pipeline.replayType === 'Pipeline' ? (
                    <Autocomplete
                        id="run_autocomplete"
                        onChange={(event, newValue) => {
                            setPipeline((p) => ({ ...p, replayRunID: newValue.run_id }));
                            return setSelectedReplayRun(newValue);
                        }}
                        value={selectedReplayRun}
                        disableClearable
                        sx={{
                            minWidth: '300px',
                            '.MuiInputBase-input': { py: '0 !important', marginTop: '-2px' },
                            '.MuiAutocomplete-inputRoot': { height: '40px' },
                        }}
                        options={runs}
                        getOptionLabel={(option) => (option.created_at ? formatDateNoZone(option.created_at, MeData.timezone.get()) + '\n' + option.run_id : '')}
                        renderOption={(props, option) => (
                            <div {...props} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                <Typography sx={{ fontSize: '0.75rem', lineHeight: '1.3', py: 0 }}>{formatDateNoZone(option.created_at, MeData.timezone.get())}</Typography>
                                <Typography sx={{ fontSize: '0.75rem', lineHeight: '1.3', py: 0 }}>{option.run_id}</Typography>
                            </div>
                        )}
                        renderInput={(params) => (
                            <TextField multiline {...params} id="run" size="small" sx={{ '& div textarea': { fontSize: '0.75rem', lineHeight: '1.3', py: 0 }, display: 'flex' }} />
                        )}
                    />
                ) : (
                    <TextField
                        id="group"
                        size="small"
                        sx={{ width: '300px' }}
                        value={pipeline.replayGroup}
                        onChange={(e) => setPipeline((p) => ({ ...p, replayGroup: e.target.value }))}
                    />
                )}

                <Grid item sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button variant="outlined" sx={{ ml: 2, backgroundColor: 'background.main' }} onClick={handleClose}>
                        Close
                    </Button>
                </Grid>
            </Grid>
            {pipeline.environmentID ? (
                <Box sx={{ minHeight: 'calc(100vh - 150px)', position: 'relative' }}>
                    <Box>
                        <ResponsiveGridLayout
                            draggableHandle=".drag-handle"
                            // onLayoutChange={(e, _) => console.log('Change layout', e, _)}
                            isDraggable={true}
                            verticalCompact
                            measureBeforeMount={true}
                            // onResizeStop={(e, _) => console.log('Resize', e, _)}
                            compactType="vertical"
                            rowHeight={(height - 200) * 0.25}
                            layouts={getGridLayouts(pipeline.nodeTypeDesc, EditorGlobal.markdown.value, isMarkdown(EditorGlobal.selectedFile?.name?.value), showLogs)}
                            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                            cols={{ lg: 12, md: 6, sm: 3, xs: 2, xxs: 2 }}>
                            <FileManagerColumn key="1" pipeline={pipeline} />
                            {pipeline.nodeTypeDesc === 'python' ? <PackageColumn key="2" pipeline={pipeline} packages={packages} setPackages={setPackages} /> : null}
                            <EditorColumn key="3" ref={editorRef} pipeline={pipeline} />
                            {currentTab === 'code' && <LogsColumn key="4" pipeline={pipeline} />}
                            {currentTab === 'install' && (
                                <InstallationLogsColumn
                                    key="4"
                                    environmentID={Environment.id.get()}
                                    pipelineID={pipeline.pipelineID}
                                    workerGroup={pipeline.workerGroup}
                                    setPackages={setPackages}
                                />
                            )}
                            {currentTab === 'markdown' && EditorGlobal.markdown.get() === 'edit' && <Markdown key="4" />}
                        </ResponsiveGridLayout>
                    </Box>
                </Box>
            ) : null}
        </Box>
    );
};

export default PipelineEditor;

// ------ Custom hooks
const useGetPipelineHook = (environmentID, setPipeline) => {
    // GraphQL hooks
    const getPipeline = useGetPipeline();
    const getNode = useGetNode();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const { pipelineId, nodeId } = useParams();

    return async () => {
        // Get Node
        const responseNode = await getNode({ pipelineID: pipelineId, environmentID, nodeID: nodeId });

        if (responseNode.r || responseNode.error) {
            closeSnackbar();
            enqueueSnackbar("Can't get node: " + (responseNode.msg || responseNode.r || responseNode.error), { variant: 'error' });
        } else if (responseNode.errors) {
            responseNode.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        }

        // Get pipeline
        const responsePipeline = await getPipeline({ pipelineID: pipelineId, environmentID });

        if (responsePipeline.r || responsePipeline.error) {
            closeSnackbar();
            enqueueSnackbar("Can't get pipeline: " + (responsePipeline.msg || responsePipeline.r || responsePipeline.error), { variant: 'error' });
        } else if (responsePipeline.errors) {
            responsePipeline.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            const nodeName = responseNode.name;
            setPipeline((p) => ({ ...p, ...responseNode, ...responsePipeline, nodeName }));
        }
    };
};

// ------- Custom Hooks
const useGetPipelineRunsHook = (environmentID, setRuns, setSelectedReplayRun, setPipeline) => {
    // GraphQL hook
    const getPipelineRuns = useGetPipelineRuns();

    const { enqueueSnackbar } = useSnackbar();

    const { pipelineId } = useParams();

    // Get runs
    return async () => {
        const response = await getPipelineRuns({ pipelineID: pipelineId, environmentID });

        if (response === null) {
            setRuns([]);
        } else if (response.r || response.error) {
            enqueueSnackbar("Can't get pipeline runs: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setRuns(response);
            setSelectedReplayRun(response[0]);
            setPipeline((p) => ({ ...p, replayRunID: response[0].run_id }));
        }
    };
};
