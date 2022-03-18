import { Box, Chip, Grid, IconButton, Typography, useTheme } from '@mui/material';
import { forwardRef, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlayCircle, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useGlobalEditorState } from '../../../pages/Editor';
import { Downgraded } from '@hookstate/core';
import { useState } from 'react';
import CustomDragHandle from '../../CustomDragHandle';

const EditorColumn = forwardRef(({ children, ...rest }, ref) => {
    // Editor state
    const [, setEditorInstance] = useState(null);

    // Theme hook
    const theme = useTheme();

    // Global editor state
    const EditorGlobal = useGlobalEditorState();

    // Ref
    const editorRef = useRef(null);

    const handleEditorOnMount = (editor) => {
        editorRef.current = editor;
        setEditorInstance(editor);
        EditorGlobal.editor.set(editor);

        const handler = editor.onDidChangeModelDecorations((_) => {
            handler.dispose();
            editor.getAction('editor.action.formatDocument').run();
        });

        window.addEventListener('resize', () => {
            editor.layout({
                width: 'auto',
                height: 'auto',
            });
        });
    };

    const handleTabClick = (tab) => {
        const selectedId = EditorGlobal.selectedFile.attach(Downgraded).get()?.id;

        // Check to see if tab is already selected
        if (selectedId === tab.id) {
            return;
        }

        EditorGlobal.selectedFile.set(tab);
    };

    const handleTabClose = (tab) => {
        const tabs = EditorGlobal.tabs.attach(Downgraded).get();
        console.log('🚀 ~ file: index.jsx ~ line 55 ~ handleTabClose ~ tabs', tabs);

        // Check to see if it's unsaved
        if (tab?.isEditing) {
            alert('Still editing');
            return;
        }

        const newTabs = tabs.filter((prevtab) => prevtab?.id !== tab?.id);

        if (newTabs.length === 0) {
            EditorGlobal.selectedFile.set(null);
        } else {
            EditorGlobal.selectedFile.set(newTabs[newTabs.length - 1]);
        }

        EditorGlobal.tabs.set(newTabs);
    };

    const handleEditorChange = (value) => {
        if (value !== EditorGlobal.selectedFile.get()?.content) {
            EditorGlobal.selectedFile.isEditing.set(true);
            EditorGlobal.selectedFile.diffValue.set(value);
        } else {
            EditorGlobal.selectedFile.isEditing.set(false);
        }
    };

    /*     const renderPath = () => {
        if(EditorGlobal.currentPath.get() && EditorGlobal.currentPath.get().length > 0){
            EditorGlobal.currentPath.get()?.map()
        }else{
            return '>'
        }
    } */

    // Handle ctrl+s
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleKeyDown = (e) => {
        if (e.keyCode === 83 && e.ctrlKey) {
            alert('ctrl+s clicked...');
        }
    };

    return (
        <div {...rest}>
            <Box
                sx={{
                    backgroundColor: 'background.main',
                    border: '1px solid  #D3D3D3',
                    borderRadius: '7px',
                    ml: 0.8,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    overflow: 'hidden',
                }}>
                <Grid container flexWrap="noWrap" sx={{ width: rest?.style?.width, overflowX: 'auto', overflowY: 'hidden', whiteSpace: 'nowrap' }}>
                    {EditorGlobal.tabs
                        .attach(Downgraded)
                        .get()
                        ?.reverse()
                        ?.map((tabs) => {
                            return (
                                <Box
                                    key={tabs.id}
                                    sx={{
                                        border: '1px solid #B9B9B9',
                                        color: (theme) => theme.palette.editorPage.tabTextColorNotActive,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        borderBottomWidth: EditorGlobal.selectedFile.get()?.id === tabs.id ? 4 : 1,
                                        borderBottomColor: EditorGlobal.selectedFile.get()?.id === tabs.id ? 'primary.main' : '#B9B9B9',
                                    }}>
                                    <Typography onClick={() => handleTabClick(tabs)} sx={{ padding: '8px 11px' }} fontSize={15}>
                                        {tabs?.name}
                                    </Typography>
                                    {tabs.isEditing && <Box sx={{ width: 8, height: 8, mt: 0.5, backgroundColor: 'secondary.main', borderRadius: '50%' }} />}
                                    <IconButton aria-label="close" sx={{ ml: 2 }} onClick={() => handleTabClose(tabs)}>
                                        <Box component={FontAwesomeIcon} icon={faTimes} sx={{ fontSize: 13 }} />
                                    </IconButton>
                                </Box>
                            );
                        })}
                </Grid>

                {EditorGlobal.tabs.get().length > 0 && EditorGlobal.selectedFile.get() && Object.keys(EditorGlobal.selectedFile.attach(Downgraded).get().length > 0) ? (
                    <Grid container alignItems="center" justifyContent="space-between" sx={{ p: '6px 15px', border: '1px solid #B9B9B9', mb: 2 }}>
                        <Typography fontSize={15}>
                            {'>'} code-files {'>'} clear_the_logs.py
                        </Typography>

                        <Chip
                            avatar={<Box component={FontAwesomeIcon} sx={{ color: '#ffffff!important', fontSize: 18 }} icon={faPlayCircle} />}
                            label="Play"
                            sx={{ mr: 0, bgcolor: 'primary.main', color: '#fff', fontWeight: 600 }}
                        />
                    </Grid>
                ) : null}

                {EditorGlobal.tabs.get().length > 0 ? (
                    <Editor
                        onMount={handleEditorOnMount}
                        defaultLanguage={EditorGlobal.selectedFile.get()?.language}
                        path={EditorGlobal.selectedFile.get()?.name}
                        defaultValue={EditorGlobal.selectedFile.get()?.content}
                        theme={theme.palette.mode === 'dark' ? 'vs-dark' : 'customTheme'}
                        height="100%"
                        saveViewState
                        onChange={handleEditorChange}
                    />
                ) : (
                    <Grid height="100%" container alignItems="center" justifyContent="center">
                        <Typography>Select a file to open</Typography>
                    </Grid>
                )}
            </Box>
            {children}
            <CustomDragHandle bottom={7} left={15} />
        </div>
    );
});

export default EditorColumn;
