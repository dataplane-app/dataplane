import { Box, Chip, Grid, IconButton, Typography, useTheme } from '@mui/material';
import { forwardRef, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlayCircle, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useGlobalEditorState } from '../../../pages/Editor';
import { Downgraded } from '@hookstate/core';
import { useState } from 'react';

const EditorColumn = forwardRef(({ children, ...rest }, ref) => {
    // Editor state
    const [editorInstance, setEditorInstance] = useState(null);

    // Theme hook
    const theme = useTheme();

    // Global editor state
    const EditorGlobal = useGlobalEditorState();

    // Ref
    const editorRef = useRef(null);

    const handleEditorOnMount = (editor) => {
        editorRef.current = editor;
        setEditorInstance(editor);

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

        if (editorInstance) {
            const handler = editorInstance.onDidChangeModelDecorations((_) => {
                handler.dispose();
                editorInstance.getAction('editor.action.formatDocument').run();
            });
        }

        EditorGlobal.selectedFile.set(tab);
    };

    const handleTabClose = (tab) => {
        const tabs = EditorGlobal.tabs.attach(Downgraded).get();

        // Check to see if it's unsaved
        console.log('TABS CLOSING', tab);

        const newTabs = tabs.filter((prevtab) => prevtab?.id !== tab?.id);

        if (newTabs.length === 0) {
            EditorGlobal.selectedFile.set(null);
        } else {
            EditorGlobal.selectedFile.set(newTabs[newTabs.length - 1]);
        }

        EditorGlobal.tabs.set(newTabs);
    };

    const handleEditorChange = (value) => {
        const selected = EditorGlobal.selectedFile.attach(Downgraded).get();
        if (selected) {
            EditorGlobal.selectedFile.isEditing.set(true);
            EditorGlobal.selectedFile.diffValue.set(value);
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
                <Grid container alignItems="stretch">
                    {EditorGlobal.tabs
                        .attach(Downgraded)
                        .get()
                        ?.map((tabs) => {
                            console.log('TABSSS', tabs);

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
                                    {tabs.isEditing && <Box sx={{ width: 8, height: 8, mt: 0.5, backgroundColor: 'red', borderRadius: '50%' }} />}
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
                        language={EditorGlobal.selectedFile.get()?.language}
                        path={EditorGlobal.selectedFile.get()?.name}
                        value={EditorGlobal.selectedFile.get()?.content}
                        theme={theme.palette.mode === 'dark' ? 'vs-dark' : 'customTheme'}
                        height="100%"
                        onChange={handleEditorChange}
                    />
                ) : (
                    <Grid height="100%" container alignItems="center" justifyContent="center">
                        <Typography>Select a file to open</Typography>
                    </Grid>
                )}
            </Box>
            {children}
        </div>
    );
});

export default EditorColumn;
