import { Box, Button, Grid, IconButton, Typography, useTheme } from '@mui/material';
import { forwardRef, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useGlobalEditorState } from '../../../pages/Editor';
import { Downgraded } from '@hookstate/core';
import { useState } from 'react';
import CustomDragHandle from '../../CustomDragHandle';
import { useUploadFileNode } from '../../../graphql/uploadFileNode';
import { useSnackbar } from 'notistack';
import { useGlobalAuthState } from '../../../Auth/UserAuth';
import { useRunCEFile } from '../../../graphql/runCEFile';
import { useStopCERun } from '../../../graphql/stopCERun';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import MonacoEditor, { monaco } from 'react-monaco-editor';

const codeFilesEndpoint = process.env.REACT_APP_CODE_ENDPOINT_PRIVATE;

const EditorColumn = forwardRef(({ children, ...rest }, ref) => {
    // Editor state
    const [, setEditorInstance] = useState(null);
    const [tabValue, setTabValue] = useState(0);

    // Run state
    const [isRunning, setIsRunning] = useState(false);

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
    const codeEditorRun = useRunCEFileHook(rest.pipeline, setIsRunning);
    const codeEditorStop = useStopCEFileHook(rest.pipeline, EditorGlobal.runID.get(), setIsRunning);

    useEffect(() => {
        const fileIndex = EditorGlobal.tabs
            .get()
            .map((tabs) => tabs?.id)
            .indexOf(EditorGlobal.selectedFile.attach(Downgraded).get()?.id);

        if (fileIndex !== -1) {
            setTabValue(fileIndex);
        } else {
            setTabValue(0);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [EditorGlobal.tabs.get()]);

    useEffect(() => {
        function getOrCreateModel(fileName, value) {
            const existingModel = monaco.editor.getModel(monaco.Uri.file(fileName));
            return existingModel ? existingModel : monaco.editor.createModel(value, undefined, monaco.Uri.file(fileName));
        }

        if (EditorGlobal.selectedFile.get()?.name && editorRef.current) {
            const model = editorRef.current.getModel();
            const fileName = EditorGlobal.selectedFile.get()?.name;
            editorRef.current.setModel(getOrCreateModel(fileName, model.value));
        }
    }, [EditorGlobal.selectedFile.get()?.name]);

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

    const handleTabClose = (tab, e) => {
        setTabValue(0);
        e.stopPropagation();
        const tabs = EditorGlobal.tabs.attach(Downgraded).get();

        const newTabs = tabs.filter((prevtab) => prevtab?.id !== tab?.id);

        if (newTabs.length === 0) {
            EditorGlobal.selectedFile.set(null);
        } else {
            EditorGlobal.selectedFile.set(newTabs[newTabs.length - 1]);
        }

        EditorGlobal.tabs.set(newTabs);
    };

    const handleEditorChange = (value) => {
        EditorGlobal.selectedFile.isEditing.set(true);
        EditorGlobal.selectedFile.diffValue.set(value);
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
        // Clear runID tab change, this is to stop websockets if running
        EditorGlobal.runID.set(null);
        EditorGlobal.installState.set(null);

        EditorGlobal.runState.set(null);
        // If no selection, return
        if (!EditorGlobal.selectedFile.value || EditorGlobal.selectedFile.fType.value === 'folder') return;

        // If it is a folder, return
        if (EditorGlobal.selectedFile.fType.value === 'folder') return;

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

        if (EditorGlobal.selectedFile.fType.value === 'file') {
            fetch(`${codeFilesEndpoint}/${EditorGlobal.selectedFile.id.value}?environment_id=${rest.pipeline.environmentID}&pipeline_id=${rest.pipeline.pipelineID}`, {
                headers: { Authorization: `Bearer ${jwt}` },
                withCredentials: true,
            })
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
        }

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
            if (EditorGlobal.selectedFile.fType.value === 'file') {
                uploadFileNode();
            }
            if (EditorGlobal.selectedFile.fType.value === 'package') {
                EditorGlobal.installState.set('Running');
            }
        }
    };

    // Set Run/Stop button
    let runState = EditorGlobal.runState.get();
    useEffect(() => {
        if (runState === 'Running') {
            setIsRunning(true);
        } else {
            setIsRunning(false);
        }
    }, [runState]);

    // Editor configs
    useEffect(() => {
        monaco.editor.defineTheme('dp-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
                'editor.background': '#0e1928',
                'editorLineNumber.foreground': '#3C7790',
                'editorLineNumber.activeForeground': '#0E236B',
            },
        });
    }, []);

    return (
        <div {...rest} ref={ref}>
            <Box
                sx={{
                    backgroundColor: 'background.main',
                    border: 1,
                    borderColor: 'editorPage.borderColor',
                    ml: 0.8,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    overflow: 'hidden',
                }}>
                <Grid container flexWrap="noWrap" sx={{ width: rest?.style?.width, overflowX: 'auto', overflowY: 'hidden', whiteSpace: 'nowrap' }}>
                    <Tabs
                        value={tabValue}
                        onChange={(ev, newValue) => setTabValue(newValue)}
                        variant="scrollable"
                        scrollButtons={false}
                        sx={{
                            '& .MuiTabs-scroller': { height: '32px' },
                            minHeight: '32px',
                            '& .MuiTabs-indicator': { height: '4px' },
                            '& .Mui-selected': { color: (theme) => `${theme.palette.editorPage.tabTextColor} !important` },
                        }}>
                        {EditorGlobal.tabs
                            .attach(Downgraded)
                            .get()
                            ?.map((tabs, idx) => {
                                return (
                                    <Tab
                                        key={tabs.id}
                                        onClick={() => handleTabClick(tabs)}
                                        label={tabs?.name}
                                        disableRipple
                                        value={idx}
                                        icon={
                                            <IconButton
                                                aria-label="close"
                                                disableRipple
                                                disableFocusRipple
                                                onClick={(e) => handleTabClose(tabs, e)}
                                                style={{ marginLeft: 0, paddingLeft: 12 }}>
                                                {tabs.isEditing && <Box sx={{ width: 8, height: 8, marginRight: 1, backgroundColor: 'secondary.main', borderRadius: '50%' }} />}
                                                <Box component={FontAwesomeIcon} icon={faTimes} sx={{ fontSize: 13 }} color="editorPage.fileManagerIcon" />
                                            </IconButton>
                                        }
                                        iconPosition="end"
                                        sx={{
                                            borderRight: 1,
                                            borderColor: 'editorPage.borderColor',
                                            color: 'editorPage.tabTextColorNotActive',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            minHeight: 'auto',
                                            height: '32px',
                                            pr: '4px',
                                            fontSize: '0.75rem',
                                        }}
                                    />
                                );
                            })}
                    </Tabs>
                </Grid>

                {EditorGlobal.tabs.get().length > 0 && EditorGlobal.selectedFile.get() && Object.keys(EditorGlobal.selectedFile.attach(Downgraded).get().length > 0) ? (
                    <Grid
                        container
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ pl: '15px', borderTop: 1, borderBottom: 1, borderColor: 'editorPage.borderColor', mb: 2, height: '33px' }}>
                        <Typography fontSize={'0.75rem'}>
                            {EditorGlobal.currentPath?.get()?.map((folderName) => folderName + ' > ')}
                            {EditorGlobal.selectedFile.name.value}
                        </Typography>

                        {EditorGlobal.selectedFile.id.get() !== 'requirements.txt' ? (
                            <Box>
                                {isRunning ? (
                                    <Button onClick={codeEditorStop} variant="text" color="error" sx={{ height: '32px', fontSize: '0.75rem', minWidth: '60px' }}>
                                        Stop
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={codeEditorRun}
                                        variant="text"
                                        sx={{ height: '32px', color: theme.palette.mode === 'dark' ? 'editorPage.fileManagerIcon' : null, fontSize: '0.75rem', minWidth: '60px' }}>
                                        Run
                                    </Button>
                                )}

                                <Button
                                    onClick={uploadFileNode}
                                    variant="text"
                                    disabled={!EditorGlobal.selectedFile.diffValue.get()}
                                    sx={{ height: '32px', color: theme.palette.mode === 'dark' ? 'editorPage.fileManagerIcon' : null, fontSize: '0.75rem', minWidth: '60px' }}>
                                    Save
                                </Button>
                            </Box>
                        ) : (
                            <Button
                                onClick={() => {
                                    EditorGlobal.installState.set('Running');
                                }}
                                variant="text"
                                disabled={!EditorGlobal.selectedFile.diffValue.get()}
                                sx={{ height: '32px', color: theme.palette.mode === 'dark' ? 'editorPage.fileManagerIcon' : null, fontSize: '0.75rem', minWidth: '60px' }}>
                                Install
                            </Button>
                        )}
                    </Grid>
                ) : null}

                <Box zIndex={10} height="100%">
                    <MonacoEditor
                        editorDidMount={handleEditorOnMount}
                        language={EditorGlobal.selectedFile.get()?.language}
                        defaultValue={EditorGlobal.selectedFile.get()?.content}
                        value={EditorGlobal.selectedFile.get()?.diffValue ?? EditorGlobal.selectedFile.get()?.content}
                        theme={theme.palette.mode === 'light' ? 'vs' : 'dp-dark'}
                        height="100%"
                        onChange={handleEditorChange}
                        options={{
                            minimap: { enabled: false },
                            hideCursorInOverviewRuler: { enabled: true },
                        }}
                    />
                </Box>

                <Grid
                    sx={{
                        backgroundColor: '#fff',
                        display: EditorGlobal.tabs.get().length > 0 ? 'none' : 'flex',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        bottom: 30,
                        right: 0,
                        zIndex: EditorGlobal.tabs.get().length > 0 ? -1 : 20,
                    }}
                    container
                    alignItems="center"
                    justifyContent="center">
                    <Typography>Select a file to open</Typography>
                </Grid>
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
        if (EditorGlobal.selectedFile.diffValue.value === undefined) return;

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

const useRunCEFileHook = (pipeline, setIsRunning) => {
    const environmentID = pipeline.environmentID;
    const pipelineID = pipeline.pipelineID;
    const nodeID = pipeline.nodeID;
    const workerGroup = pipeline.workerGroup;
    const NodeTypeDesc = pipeline.nodeTypeDesc;
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
            setIsRunning(true);
            EditorGlobal.runID.set(response.run_id);
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
        }
    };
};
