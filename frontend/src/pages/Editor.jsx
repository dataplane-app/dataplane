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

const ResponsiveGridLayout = WidthProvider(Responsive);

// Global editor state

export const globalEditorState = createState({
    selectedFile: null,
    tabs: [],
    editor: null,
    currentPath: [],
    parentID: null,
    parentName: null,
});

export const useGlobalEditorState = () => useHookState(globalEditorState);

const PipelineEditor = () => {
    // Hooks
    const history = useHistory();
    const EditorGlobal = useGlobalEditorState();
    const { state: pipeline } = useLocation();

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
                    {/* <Button variant="contained" onClick={handleSave}>
                        Save
                    </Button> */}
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
                        <FileManagerColumn key="1" pipeline={pipeline} />
                        {/* <PackageColumn key="2" /> */}
                        <EditorColumn key="3" ref={editorRef} pipeline={pipeline} />
                        <LogsColumn key="4" />
                    </ResponsiveGridLayout>
                </Box>
            </Box>
        </Box>
    );
};

export default PipelineEditor;
