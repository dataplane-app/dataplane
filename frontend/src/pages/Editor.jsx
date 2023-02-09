import { AppBar, Box, Button, Grid, Toolbar, Typography } from '@mui/material';
import { Responsive, WidthProvider } from 'react-grid-layout';
import EditorColumn from '../components/EditorPage/EditorColumn';
import FileManagerColumn from '../components/EditorPage/FileManager';
import LogsColumn from '../components/EditorPage/LogsColumn';
import PackageColumn from '../components/EditorPage/PackagesColumn';
import Navbar from '../components/Navbar';
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

    const [pipeline, setPipeline] = useState({});

    // Packages state for packages component
    const [packages, setPackages] = useState('');

    const getPipeline = useGetPipelineHook(Environment.id.get(), setPipeline);

    const editorRef = useRef(null);

    const handleUnload = () => {
        console.log('Still editing');
    };

    useEffect(() => {
        if (!Environment.id.get()) return;
        window.addEventListener('beforeunload', handleUnload);

        getPipeline();

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
                <Grid item sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
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
            setPipeline({ ...responseNode, ...responsePipeline, nodeName });
        }
    };
};
