import { AppBar, Box, Button, Grid, Toolbar, Typography } from '@mui/material';
import { Responsive, WidthProvider } from 'react-grid-layout';
import EditorColumn from '../components/EditorPage/EditorColumn';
import FileManagerColumn from '../components/EditorPage/FileManager';
import LogsColumn from '../components/EditorPage/LogsColumn';
import PackageColumn from '../components/EditorPage/PackagesColumn';
import Navbar from '../components/Navbar';
import { lgLayout, mdLayout, smLayout, xsLayout, xxsLayout } from '../utils/editorLayouts';
import { createState, useState as useHookState } from '@hookstate/core';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useHistory } from 'react-router-dom';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Global editor state

export const globalEditorState = createState({
    selectedFile: null,
    tabs: [],
});

export const useGlobalEditorState = () => useHookState(globalEditorState);

const PipelineEditor = () => {
    // Hooks
    const history = useHistory();
    const { state: pipeline } = useLocation();

    const layouts = {
        lg: lgLayout,
        md: mdLayout,
        sm: smLayout,
        xs: xsLayout,
        xxs: xxsLayout,
    };

    const handleUnload = () => {};

    useEffect(() => {
        if (!pipeline || Object.keys(pipeline).length === 0) {
            history.push('/');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        window.addEventListener('beforeunload', handleUnload);

        return () => window.removeEventListener('beforeunload', handleUnload);
    }, [handleUnload]);

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
                    <Button variant="contained">Save</Button>
                    <Button variant="outlined" sx={{ ml: 2, backgroundColor: 'background.main' }}>
                        Close
                    </Button>
                </Grid>
            </Grid>

            <Box sx={{ minHeight: 'calc(100vh - 150px)', position: 'relative' }}>
                <Box>
                    <ResponsiveGridLayout
                        onLayoutChange={(e, _) => console.log(e, _)}
                        isDraggable={true}
                        compactType="horizontal"
                        layouts={layouts}
                        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                        cols={{ lg: 12, md: 3, sm: 2, xs: 2, xxs: 2 }}>
                        <FileManagerColumn key="1" />
                        <PackageColumn key="2" />
                        <EditorColumn key="3" />
                        <LogsColumn key="4" />
                    </ResponsiveGridLayout>
                </Box>
            </Box>
        </Box>
    );
};

export default PipelineEditor;
