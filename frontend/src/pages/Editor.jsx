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
import { useUpdateFilesNode } from '../graphql/updateFilesNode';
import { useSnackbar } from 'notistack';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Global editor state

export const globalEditorState = createState({
    selectedFile: null,
    tabs: [],
    editor: null,
    currentPath: [],
});

export const useGlobalEditorState = () => useHookState(globalEditorState);

const PipelineEditor = () => {
    const [data, setData] = useState([]);

    // Hooks
    const history = useHistory();
    const EditorGlobal = useGlobalEditorState();
    const { state: pipeline } = useLocation();
    // Graphql hook
    const updateFilesNode = useUpdateFilesNodeHook(pipeline.environmentID, pipeline.pipelineID, pipeline.nodeID);

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
        if (!pipeline || Object.keys(pipeline).length === 0) {
            // history.push('/');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        window.addEventListener('beforeunload', handleUnload);

        return () => window.removeEventListener('beforeunload', handleUnload);
    }, []);

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
        updateFilesNode(data);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <AppBar
                elevation={0}
                position="fixed"
                sx={{ zIndex: (theme) => theme.zIndex.drawer, background: (theme) => theme.palette.background.secondary, borderBottom: 1, borderColor: 'divider' }}>
                <Toolbar>
                    <Navbar />
                </Toolbar>
            </AppBar>
            <Toolbar />

            <Grid container alignItems="center" justifyContent="space-between" mt={5} mb={1} sx={{ pr: 2, pl: 2 }}>
                <Typography variant="h3">
                    Code {'>'} {pipeline?.name}
                </Typography>
                <Grid item sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                    <Button variant="contained" onClick={handleSave}>
                        Save
                    </Button>
                    <Button variant="outlined" sx={{ ml: 2, backgroundColor: 'background.main' }} onClick={() => history.push(`/pipelines/view/${pipeline.pipelineID}`)}>
                        Close
                    </Button>
                </Grid>
            </Grid>

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
                        <FileManagerColumn key="1" pipeline={pipeline} data={data} setData={setData} />
                        <PackageColumn key="2" />
                        <EditorColumn key="3" ref={editorRef} />
                        <LogsColumn key="4" />
                    </ResponsiveGridLayout>
                </Box>
            </Box>
        </Box>
    );
};

export default PipelineEditor;

// ----- Custom hook
export const useUpdateFilesNodeHook = (environmentID, pipelineID, nodeID) => {
    // GraphQL hook
    const updateFilesNode = useUpdateFilesNode();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get files
    return async (data) => {
        const input = prepareFilesNodeForBackend(data, environmentID, pipelineID, nodeID);
        // return;
        const response = await updateFilesNode({ input });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get files: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
        }
    };
};

function prepareFilesNodeForBackend(files, environmentID, pipelineID, nodeID) {
    let array = [];
    array.push({
        folderID: files.id,
        parentID: files.parentID,
        environmentID,
        pipelineID,
        nodeID,
        folderName: files.name,
        fType: files.fType,
        active: true,
    });

    function recursive(arr) {
        for (const key of arr) {
            if (key.children) {
                recursive(key.children);
            }
            array.push({
                folderID: key.id,
                parentID: key.parentID,
                environmentID,
                pipelineID,
                nodeID,
                folderName: key.name,
                fType: key.fType,
                active: true,
            });
        }
        return array;
    }
    recursive(files.children);

    return array;
}
