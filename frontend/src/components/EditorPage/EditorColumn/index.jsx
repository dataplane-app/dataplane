import { Box, Button, Chip, Grid, IconButton, Typography, useTheme } from '@mui/material';
import { forwardRef, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlayCircle, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useGlobalEditorState } from '../../../pages/Editor';
import { Downgraded } from '@hookstate/core';
import { useState } from 'react';
import CustomDragHandle from '../../CustomDragHandle';
import { useUploadFileNode } from '../../../graphql/uploadFileNode';
import { useSnackbar } from 'notistack';
import { useGlobalAuthState } from '../../../Auth/UserAuth';
import { useRunCEFile } from '../../../graphql/runCEFile';
import { useStopCERun } from '../../../graphql/stopCERun';

const codeFilesEndpoint = process.env.REACT_APP_CODE_ENDPOINT_PRIVATE;

const EditorColumn = forwardRef(({ children, ...rest }, ref) => {
    // Editor state
    const [, setEditorInstance] = useState(null);

    // Run state
    const [isRunning, setIsRunning] = useState(false);
    const [runID, setRunID] = useState(null);

    // Theme hook
    const theme = useTheme();

    const { enqueueSnackbar } = useSnackbar();

    const authState = useGlobalAuthState();
    const jwt = authState.authToken.get();

    // Global editor state
    const EditorGlobal = useGlobalEditorState();

    // Ref
    const editorRef = useRef(null);

    // Graphql hook
    const uploadFileNode = useUploadFileNodeHook(rest.pipeline);
    const codeEditorRun = useRunCEFileHook(rest.pipeline, setRunID, setIsRunning);
    const codeEditorStop = useStopCEFileHook(rest.pipeline, runID, setIsRunning);

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

    // Handle tab change
    useEffect(() => {
        // If no selection, return
        if (!EditorGlobal.selectedFile.value || EditorGlobal.selectedFile.fType.value !== 'file') return;

        // If it isn't a file, return
        if (EditorGlobal.selectedFile.fType.value !== 'file') return;

        // If newly created, return
        if (EditorGlobal.selectedFile.id.value.length < 10) return;

        // If selected file already has content, return
        if (EditorGlobal.selectedFile.content.value) {
            return;
        }
        if (
            EditorGlobal.selectedFile.content.value &&
            EditorGlobal.selectedFile.diffValue.value &&
            EditorGlobal.selectedFile.content.value === EditorGlobal.selectedFile.diffValue.value
        ) {
            return;
        }
        fetch(`${codeFilesEndpoint}/${EditorGlobal.selectedFile.id.value}?environment_id=${rest.pipeline.environmentID}`)
            .then(async (response) => {
                if (response.status !== 200) {
                    const error = (response && response.statusText) || response.status;
                    return Promise.reject(error);
                }
                let fileContent = await response.text();
                EditorGlobal.selectedFile.content.set(fileContent);
            })
            .catch((error) => {
                enqueueSnackbar("Can't get file: " + error, { variant: 'error' });
            });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [EditorGlobal.selectedFile?.id?.value]);

    // Handle ctrl+s
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jwt]);
    const handleKeyDown = (e) => {
        if (e.keyCode === 83 && e.ctrlKey) {
            e.preventDefault();
            if (!EditorGlobal.selectedFile.name.value) return;
            uploadFileNode();
        }
    };

    return (
        <div {...rest}>
            <Box
                sx={{
                    backgroundColor: 'background.main',
                    border: '1px solid  #D3D3D3',
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
                                        color: (theme) =>
                                            EditorGlobal.selectedFile.get()?.id === tabs.id
                                                ? theme.palette.editorPage.tabTextColor
                                                : theme.palette.editorPage.tabTextColorNotActive,
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
                            code-files {'>'} {rest.pipeline.nodeName} {'>'} clear_the_logs.py
                        </Typography>

                        <Box>
                            <Button onClick={uploadFileNode} variant="text" color="primary">
                                Save
                            </Button>

                            {isRunning ? (
                                <Button onClick={codeEditorStop} variant="text" color="error">
                                    Stop
                                </Button>
                            ) : (
                                <Button onClick={codeEditorRun} variant="text" color="primary">
                                    Run
                                </Button>
                            )}
                        </Box>
                    </Grid>
                ) : null}

                {EditorGlobal.tabs.get().length > 0 ? (
                    <Editor
                        onMount={handleEditorOnMount}
                        defaultLanguage={EditorGlobal.selectedFile.get()?.language}
                        path={EditorGlobal.selectedFile.get()?.name}
                        defaultValue={EditorGlobal.selectedFile.get()?.content}
                        value={EditorGlobal.selectedFile.get()?.diffValue || EditorGlobal.selectedFile.get()?.content}
                        theme={theme.palette.mode === 'dark' ? 'vs-dark' : 'customTheme'}
                        height="100%"
                        saveViewState
                        onChange={handleEditorChange}
                        options={{
                            minimap: { enabled: false },
                            hideCursorInOverviewRuler: { enabled: true },
                        }}
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

// ----- Custom hook
export const useUploadFileNodeHook = (pipeline) => {
    const environmentID = pipeline.environmentID;
    const pipelineID = pipeline.pipelineID;
    const nodeID = pipeline.nodeID;

    // Global editor state
    const EditorGlobal = useGlobalEditorState();

    // GraphQL hook
    const uploadFileNode = useUploadFileNode();

    const { enqueueSnackbar } = useSnackbar();

    // Upload file
    return async () => {
        const file = new File([EditorGlobal.selectedFile.diffValue.value], EditorGlobal.selectedFile.name.value, {
            type: 'text/plain',
        });
        const response = await uploadFileNode({ environmentID, pipelineID, nodeID, folderID: EditorGlobal.selectedFile.parentID.value, file });

        if (response.r || response.error) {
            enqueueSnackbar("Can't get files: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('File saved.', { variant: 'success' });
            EditorGlobal.selectedFile.id.set(response);
            EditorGlobal.selectedFile.isEditing.set(false);
        }
    };
};

const useRunCEFileHook = (pipeline, setRunID, setIsRunning) => {
    const environmentID = pipeline.environmentID;
    const pipelineID = pipeline.pipelineID;
    const nodeID = pipeline.nodeID;
    const workerGroup = pipeline.workerGroup;
    const NodeTypeDesc = pipeline.NodeTypeDesc;
    // Global editor state
    const EditorGlobal = useGlobalEditorState();
    const fileID = EditorGlobal.selectedFile?.id?.get();

    // GraphQL hook
    const runCEFile = useRunCEFile();

    const { enqueueSnackbar } = useSnackbar();

    // Run script
    return async () => {
        const response = await runCEFile({ environmentID, pipelineID, nodeID, fileID, NodeTypeDesc, workerGroup });

        if (response.r || response.error) {
            enqueueSnackbar("Can't get files: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            setIsRunning(true);
            setRunID(response.run_id);
        }
    };
};

const useStopCEFileHook = (pipeline, runID, setIsRunning) => {
    const environmentID = pipeline.environmentID;
    const pipelineID = pipeline.pipelineID;

    // GraphQL hook
    const stopCEFile = useStopCERun();

    const { enqueueSnackbar } = useSnackbar();

    // Run script
    return async () => {
        setIsRunning(false);
        const response = await stopCEFile({ environmentID, pipelineID, runID });

        if (response.r || response.error) {
            enqueueSnackbar("Can't get files: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
        }
    };
};
