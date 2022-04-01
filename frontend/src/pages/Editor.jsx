import { AppBar, Box, Button, Grid, Toolbar, Typography } from '@mui/material';
import { Responsive, WidthProvider } from 'react-grid-layout';
import EditorColumn from '../components/EditorPage/EditorColumn';
import FileManagerColumn from '../components/EditorPage/FileManager';
import LogsColumn from '../components/EditorPage/LogsColumn';
import PackageColumn from '../components/EditorPage/PackagesColumn';
import Navbar from '../components/Navbar';
import { lgLayout, mdLayout, smLayout, xsLayout, xxsLayout } from '../utils/editorLayouts';
import { createState, useState as useHookState } from '@hookstate/core';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import { Downgraded } from '@hookstate/core';
import { useGlobalEnvironmentState } from '../components/EnviromentDropdown';
import { useSnackbar } from 'notistack';
import { useGetPipeline } from '../graphql/getPipeline';

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
});

export const useGlobalEditorState = () => useHookState(globalEditorState);

const PipelineEditor = () => {
    const Environment = useGlobalEnvironmentState();

    // Hooks
    const history = useHistory();
    const EditorGlobal = useGlobalEditorState();
    const state = useLocation();

    const search = state.search === '' ? state.pathname : state.search;
    const searchParams = new URLSearchParams(search);
    const nodeName = searchParams.get('nodeName');
    const nodeID = searchParams.get('nodeID');
    const pipelineID = searchParams.get('pipelineID');
    const NodeTypeDesc = searchParams.get('NodeTypeDesc');

    const [pipeline, setPipeline] = useState({});

    const getPipeline = useGetPipelineHook(Environment.id.get(), setPipeline);

    const editorRef = useRef(null);

    const layouts = {
        lg: lgLayout,
        md: mdLayout,
        sm: smLayout,
        xs: xsLayout,
        xxs: xxsLayout,
    };

    const handleUnload = () => {
        console.log('Still editing');
    };

    useEffect(() => {
        if (!Environment.id.get()) return;
        window.addEventListener('beforeunload', handleUnload);
        setPipeline((p) => ({ nodeName, nodeID, pipelineID, NodeTypeDesc }));

        getPipeline(pipelineID);

        return () => window.removeEventListener('beforeunload', handleUnload);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Environment.id.get()]);

    const handleSave = () => {
        // Save code here
        const tabs = EditorGlobal.tabs.attach(Downgraded).get();

        if (tabs && tabs.length > 0) {
            tabs.map((tab) => {
                tab.content = tab.diffValue;
                tab.isEditing = false;
                return true;
            });
        }
    };

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
        });
        history.push(`/pipelines/view/${pipeline.pipelineID}`);
    };
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
                    {/* <Button variant="contained" onClick={handleSave}>
                        Save
                    </Button> */}
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
                            onLayoutChange={(e, _) => console.log('Change layout', e, _)}
                            isDraggable={true}
                            verticalCompact
                            measureBeforeMount={true}
                            onResizeStop={(e, _) => console.log('Resize', e, _)}
                            compactType="vertical"
                            layouts={layouts}
                            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                            cols={{ lg: 12, md: 6, sm: 3, xs: 2, xxs: 2 }}>
                            <FileManagerColumn key="1" pipeline={pipeline} />
                            {/* <PackageColumn key="2" /> */}
                            <EditorColumn key="3" ref={editorRef} pipeline={pipeline} />
                            <LogsColumn key="4" environmentID={Environment.id.get()} pipelineID={pipelineID} />
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
    // GraphQL hook
    const getPipeline = useGetPipeline();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get members
    return async (pipelineID) => {
        const response = await getPipeline({ pipelineID, environmentID });

        if (response.r || response.error) {
            closeSnackbar();
            enqueueSnackbar("Can't get pipeline: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setPipeline((p) => ({ ...p, ...response }));
        }
    };
};
