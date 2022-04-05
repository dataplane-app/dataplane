import { faChevronDown, faChevronRight, faFile, faFolder, faPencilAlt, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import TreeItem from '@mui/lab/TreeItem';
import TreeView from '@mui/lab/TreeView';
import { Autocomplete, Box, Drawer, Grid, IconButton, TextField, Typography, useTheme } from '@mui/material';
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { useState as useHookState } from '@hookstate/core';
import { useGlobalEditorState } from '../../../pages/Editor';
import { useGetWorkerGroupsHook } from '../../DrawerContent/AddPipelineDrawer';
import { useGlobalEnvironmentState } from '../../EnviromentDropdown';
import { faFileAlt } from '@fortawesome/free-regular-svg-icons';
import { v4 as uuidv4 } from 'uuid';
import { useSnackbar } from 'notistack';
import { checkNameExist, findNodeById, getParentId, getPath, isFolder } from './functions';
import CustomDragHandle from '../../CustomDragHandle';
import { Downgraded } from '@hookstate/core';
import { useGetFilesNode } from '../../../graphql/getFilesNode';
import { useCreateFolderNode } from '../../../graphql/createFolderNode';
import { useUploadFileNodeHook } from '../EditorColumn';
import DeleteFileFolderDrawer from '../../DrawerContent/DeleteFileFolderDrawer';
import { useRenameFile } from '../../../graphql/renameFile';
import { useRenameFolder } from '../../../graphql/renameFolder';

const FileManagerColumn = forwardRef(({ children, ...rest }, ref) => {
    // Global environment state with hookstate
    const Environment = useGlobalEnvironmentState();
    const Editor = useGlobalEditorState();
    const { enqueueSnackbar } = useSnackbar();

    // Local state
    const [workerGroups, setWorkerGroups] = useState([]);
    const [workerGroup, setWorkerGroup] = useState(null);
    const [selected, setSelected] = useState(null);
    const [expanded, setExpanded] = useState([]);
    const data = useHookState({});

    // Drawer State
    const [isOpenDelete, setIsOpenDelete] = useState(false);

    // File/folder creation states
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newFileName, setNewFileName] = useState('');
    const [newFolderName, setNewFolderName] = useState('');
    const [whatTypeIsCreating, setWhatTypeIsCreating] = useState('file');
    const [isEditing, setIsEditing] = useState(false);
    const [tmpFileName, setTmpFileName] = useState(null);

    // Local ref
    const newFileRef = useRef();
    const editingFileRef = useRef();

    // Graphql hook
    const uploadFileNode = useUploadFileNodeHook(rest.pipeline);
    const createFolderNode = useCreateFolderNodeHook(rest.pipeline, selected);
    const renameFile = useRenameFileHook(rest.pipeline, selected);
    const renameFolder = useRenameFolderHook(rest.pipeline, selected);

    // Set worker group on load
    useEffect(() => {
        if (workerGroups.length === 0) return;
        setWorkerGroup(workerGroups.filter((a) => a.WorkerGroup === rest.pipeline.workerGroup)[0]);
    }, [rest.pipeline.workerGroup, workerGroups]);

    // Set parent name and id for upload file names
    useEffect(() => {
        Editor.parentName.set(data.name.get());
        Editor.parentID.set(data.id.get());

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.id?.get(), data.name?.get()]);

    // Check if selected file changed
    useEffect(() => {
        setSelected(Editor.selectedFile.get()?.id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Editor.selectedFile.get()?.id]);

    // Check if user clicked outside when adding or editing a new file/folder
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check when creating
            if (newFileRef.current && !newFileRef.current.contains(event.target)) {
                setIsAddingNew(false);
                setNewFileName('');
                setNewFolderName('');
            }

            // Check when editing
            if (event.target.className !== 'treeItemInput') {
                setIsEditing(false);
                setTmpFileName(null);
            }
        };
        document.addEventListener('click', handleClickOutside, true);
        return () => {
            document.removeEventListener('click', handleClickOutside, true);
        };
    }, []);

    // Mui Tree functions
    const handleToggle = (event, nodeIds) => {
        if (event.target.checked === undefined) return;
        setExpanded(nodeIds);
    };

    const handleSelect = (event, nodeIds) => {
        setSelected(nodeIds);
    };

    // Custom GraphQL hook
    const getWorkerGroups = useGetWorkerGroupsHook(Environment.id.get(), setWorkerGroups);

    // Get workers and files on load
    useEffect(() => {
        if (!Environment.id.get()) return;
        getWorkerGroups();
        getFilesNode();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Environment.id.get()]);

    // Handle ESC key press when adding a new file
    const escFunction = useCallback((event) => {
        if (event.keyCode === 27) {
            setIsAddingNew(false);
            setIsEditing(false);
            setTmpFileName(null);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('keydown', escFunction);

        return () => {
            document.removeEventListener('keydown', escFunction);
        };
    }, [escFunction]);

    // ####### ADD ########

    // File
    // Triggers when user click on the new file icon
    const handleNewFileIconClick = (id) => {
        setIsAddingNew(true);
        setWhatTypeIsCreating('file');

        window.setTimeout(() => {
            if (newFileRef) {
                newFileRef?.current?.focus();
            }
        }, 100);

        checkLevel();
        expandFolder(id);
    };

    // Triggers when the user is typing a file name
    const handleNewFileDone = (e) => {
        // Check if enter has being pressed
        if (e.charCode === 13) {
            const check = checkFileName(newFileName);
            const alreadyExistsFile = checkNameExist(data?.children.attach(Downgraded).get(), selected, newFileName);

            if (!check) return;
            if (alreadyExistsFile) {
                enqueueSnackbar(`This file already exists!`, { variant: 'error' });
                return;
            }

            addNewFile();
        }
    };

    // Triggers when the user is done typing file name and pressed enter
    const addNewFile = () => {
        const newFileMock = {
            id: uuidv4().split('-')[0],
            name: newFileName,
            language: undefined,
            content: ``,
            isEditing: false,
            diffValue: ``,
            fType: 'file',
            parentID: selected,
        };

        // Push new file to root children
        //Find the ID first
        const currentSelectedElement = findNodeById(data.children.attach(Downgraded).get(), selected);
        if (selected === data.id.get()) {
            // If top level folder
            let newData = { ...data.attach(Downgraded).get() };
            newData.children.push(newFileMock);
            data.set(newData);
            selectAndOpenNewFile(newFileMock);
            uploadFileNode();
        } else if (currentSelectedElement && currentSelectedElement.children) {
            // If lower level folder
            currentSelectedElement.children.push(newFileMock); // ???
            selectAndOpenNewFile(newFileMock);
            uploadFileNode();
        } else {
            return;
        }

        // Set values to default
        setNewFileName('');
        setIsAddingNew(false);
    };

    // Folder
    // Triggers when user click on the new folder icon
    const handleNewFolderIconClick = (id) => {
        setIsAddingNew(true);
        setWhatTypeIsCreating('folder');

        window.setTimeout(() => {
            if (newFileRef) {
                newFileRef?.current?.focus();
            }
        }, 100);

        checkLevel();
        expandFolder(id);
    };

    // Triggers when the user is typing a folder name
    const handleNewFolderDone = (e) => {
        // Check if enter has being pressed
        if (e.charCode === 13) {
            const check = checkFolderName(newFolderName);
            const alreadyExistsFolder = checkNameExist(data?.children.attach(Downgraded).get(), selected, newFolderName);

            if (!check) return;
            if (alreadyExistsFolder) {
                enqueueSnackbar(`This folder already exists!`, { variant: 'error' });
                return;
            }

            addNewFolder();
        }
    };

    // Triggers when the user is done typing folder name and pressed enter
    const addNewFolder = () => {
        const newFolderMock = {
            id: uuidv4().split('-')[0],
            name: newFolderName,
            children: [],
            fType: 'folder',
            parentID: selected,
        };

        // Push new file to root children
        //Find the ID first
        const currentSelectedElement = findNodeById(data.children.attach(Downgraded).get(), selected);
        if (selected === data.id.get()) {
            let newData = { ...data.attach(Downgraded).get() };
            newData.children.push(newFolderMock);
            data.set(newData);
        } else if (currentSelectedElement && currentSelectedElement.children) {
            currentSelectedElement.children.push(newFolderMock);
            selectAndOpenNewFile(newFolderMock);
        } else {
            return;
        }

        // updateFilesNode(newFolderMock, `Folder ${newFolderName} created!`);
        Editor.selectedFile.set(newFolderMock);

        createFolderNode(newFolderMock);

        // Set values to default
        setNewFolderName('');
        setIsAddingNew(false);
    };

    // ####### Edit ########
    const handleEdit = (id) => {
        changeTreeStyling(id);
        setIsEditing(true);
    };

    const handleEditFileChange = (e, nodes) => {
        if (nodes.id === selected) {
            setTmpFileName(e.target.value);
        }
    };

    const handleEditKeyPress = (e, nodes) => {
        if (e.charCode === 13) {
            const folder = isFolder(selected, data.attach(Downgraded).get());
            const elementToChange = findNodeById(data.children.attach(Downgraded).get(), selected);

            if (folder) {
                const check = checkFolderName(tmpFileName);
                const alreadyExistsFolder = checkNameExist(data?.children.attach(Downgraded).get(), selected, tmpFileName);

                if (!check) {
                    setIsEditing(false);
                    setTmpFileName(null);
                    return;
                }
                if (alreadyExistsFolder) {
                    enqueueSnackbar(`This folder already exists!`, { variant: 'error' });
                    setTmpFileName(null);
                    setIsEditing(false);
                    return;
                }

                if (elementToChange) {
                    elementToChange.name = tmpFileName;

                    renameFolder(elementToChange);

                    setTmpFileName(null);
                    setIsEditing(false);
                    changeTreeStyling();
                }
            } else {
                const check = checkFileName(tmpFileName);
                const alreadyExistsFile = checkNameExist(data?.children.attach(Downgraded).get(), selected, tmpFileName);

                if (!check) {
                    setIsEditing(false);
                    setTmpFileName(null);
                    return;
                }
                if (alreadyExistsFile) {
                    enqueueSnackbar(`This file already exists!`, { variant: 'error' });
                    setTmpFileName(null);
                    setIsEditing(false);
                    return;
                }

                if (elementToChange) {
                    elementToChange.name = tmpFileName;

                    renameFile(elementToChange);

                    setTmpFileName(null);
                    setIsEditing(false);
                    changeTreeStyling();
                    selectAndOpenNewFile(nodes);
                }
            }
        }
    };

    // ####### Delete ########
    const handleDeleteIconClick = () => {
        setIsOpenDelete(true);
    };

    // ####### Utils ########
    // Checks if selected folder is expanded
    const expandFolder = (id) => {
        setExpanded([...expanded, id]);
        setSelected(id);
    };

    // Check if it is folder of file
    const checkLevel = () => {
        if (!selected || selected === data.id.get()) return;

        const selectedInfo = findNodeById(data.children.attach(Downgraded).get(), selected);
        if (selectedInfo) {
            if (selectedInfo.children) {
                // Is folder\
                return false;
            } else {
                // Is file
                const closestParentID = getParentId(data.children.attach(Downgraded).get(), selected);
                closestParentID && setSelected(closestParentID);
            }
        }
    };

    // Open file on the editor when created
    const selectAndOpenNewFile = (newFile) => {
        // Make new file selected
        setSelected(newFile.id);

        // Call this function to open file
        handleFileClick(newFile);
    };

    // Validates file name
    const checkFileName = (fileName) => {
        // Check if it's empty
        if (fileName === null || fileName === '') {
            enqueueSnackbar(`Please provide a name for the file`, { variant: 'error' });
            setIsAddingNew(false);
            return;
        }

        // Check if has extension
        if (!fileName.includes('.')) {
            enqueueSnackbar(`Cannot create a file called: ${fileName}, check if it has a valid extension`, { variant: 'error' });
            setIsAddingNew(false);
            return;
        }

        // Check if has spaces
        if (/\s/.test(fileName)) {
            enqueueSnackbar(`Cannot create a file called: ${fileName}`, { variant: 'error' });
            setIsAddingNew(false);
            return;
        }

        return fileName;
    };

    // Validates folder name
    const checkFolderName = (folderName) => {
        // Check if it's empty
        if (folderName === null || folderName === '') {
            enqueueSnackbar(`Please provide a name for the folder`, { variant: 'error' });
            setIsAddingNew(false);
            return;
        }

        // Check if has extension
        if (folderName.includes('.')) {
            enqueueSnackbar(`Cannot add folder name, "." are not allowed for folder`, { variant: 'error' });
            return;
        }

        // Check if has spaces
        if (/\s/.test(folderName)) {
            enqueueSnackbar(`Cannot create a file called: ${folderName}`, { variant: 'error' });
            setIsAddingNew(false);
            return;
        }

        return folderName;
    };

    const changeTreeStyling = (id) => {
        const currentDOMElement = document.getElementById(`file_${id}`);

        if (currentDOMElement && !isEditing) {
            currentDOMElement.focus();
            currentDOMElement.select();
            const length = currentDOMElement.value.length;
            currentDOMElement.setSelectionRange(length, length);
        } else {
            currentDOMElement.style.border = 'none';
        }
    };

    // const checkLastTab = (newTabs) => {
    //     if (newTabs.length === 0) {
    //         Editor.selectedFile.set(null);
    //     } else {
    //         Editor.selectedFile.set(newTabs[newTabs.length - 1]);
    //     }

    //     Editor.tabs.set(newTabs);
    // };

    // Theme hook
    const theme = useTheme();

    // Render files and folders to UI
    const renderTree = (nodes) => {
        return (
            <CustomTreeItem
                className={nodes.id === data.id.get() ? 'hidden' : 'tree_parent'}
                sx={{ mt: 0.5, position: 'relative' }}
                icon={!nodes.children && <Box component={FontAwesomeIcon} icon={faFileAlt} style={{ fontSize: '0.875rem' }} sx={{ color: 'editorPage.chevron' }} />}
                key={nodes.id}
                nodeId={nodes.id}
                ref={selected === nodes.id ? editingFileRef : null}
                label={
                    <>
                        <input
                            id={`file_${nodes.id}`}
                            spellcheck="false"
                            value={tmpFileName && selected === nodes.id ? tmpFileName : tmpFileName === '' && selected === nodes.id ? '' : nodes.name}
                            onChange={(e) => handleEditFileChange(e, nodes)}
                            onKeyPress={(e) => handleEditKeyPress(e, nodes)}
                            className="treeItemInput"
                            style={{
                                border: 'none',
                                outline: 'none',
                                background: 'transparent',
                                color: theme.palette.editorPage.fileManagerText,
                                textShadow: '0 0 0 #000',
                                cursor: 'pointer',
                                paddingLeft: '25px',
                                marginLeft: '-25px',
                            }}
                            readOnly={!isEditing}
                        />
                        <Box className={`showOnHover hidden_controls tree-${nodes.id}`} sx={{ pointerEvents: 'none', width: '100%', display: 'flex', mt: '-1px' }}>
                            <IconButton
                                aria-label="Edit File"
                                sx={{ ml: 'auto', pointerEvents: 'all' }}
                                onClick={() => {
                                    setSelected(nodes.id);
                                    handleEdit(nodes.id);
                                }}>
                                <Box component={FontAwesomeIcon} icon={faPencilAlt} sx={{ color: 'editorPage.fileManagerIcon', fontSize: '0.75rem' }} />
                            </IconButton>
                            {nodes.fType !== 'file' ? (
                                <IconButton sx={{ pointerEvents: 'all' }} aria-label="New File" onClick={() => handleNewFileIconClick(nodes.id)}>
                                    <Box component={FontAwesomeIcon} icon={faFileAlt} sx={{ color: 'editorPage.fileManagerIcon', fontSize: '0.75rem' }} />
                                </IconButton>
                            ) : null}
                            {nodes.fType !== 'file' ? (
                                <IconButton sx={{ pointerEvents: 'all' }} aria-label="New Folder" onClick={() => handleNewFolderIconClick(nodes.id)}>
                                    <Box component={FontAwesomeIcon} icon={faFolder} sx={{ color: 'editorPage.fileManagerIcon', fontSize: '0.75rem' }} />
                                </IconButton>
                            ) : null}
                            <IconButton sx={{ pointerEvents: 'all' }} aria-label="Remove folder" onClick={handleDeleteIconClick}>
                                <Box component={FontAwesomeIcon} icon={faTimes} sx={{ color: 'editorPage.fileManagerIcon', fontSize: '0.75rem' }} />
                            </IconButton>
                        </Box>
                    </>
                }
                onClick={() => handleFileClick(nodes)}>
                {Array.isArray(nodes.children)
                    ? nodes.children.map((node) => {
                          return renderTree(node);
                      })
                    : null}
                {nodes.id === selected && isAddingNew ? (
                    <input
                        onKeyPress={whatTypeIsCreating === 'file' ? handleNewFileDone : handleNewFolderDone}
                        ref={newFileRef}
                        style={{ width: '90%', marginLeft: 10, background: 'transparent', border: 'none', color: theme.palette.editorPage.fileManagerText }}
                        type="text"
                        value={whatTypeIsCreating === 'file' ? newFileName : newFolderName}
                        onChange={(e) => (whatTypeIsCreating === 'file' ? setNewFileName(e.target.value) : setNewFolderName(e.target.value))}
                    />
                ) : null}
            </CustomTreeItem>
        );
    };

    const handleFileClick = (file) => {
        // Triggers when user clicks on a already created file
        // Return if it's not a file
        if (file.children && file.children.length >= 0) {
            return;
        }

        const prevTabs = Editor.tabs.get();

        // Check if file is already open
        if (prevTabs.filter((tab) => tab.id === file.id).length > 0) {
            Editor.selectedFile.set(file);
            const path = getPath(data.children.attach(Downgraded).get(), file.id);
            Editor.currentPath.set(path);
            return;
        }

        Editor.selectedFile.set(file);
        Editor.tabs.set((prevTabs) => [...prevTabs, file]);

        // Set file path
        const path = getPath(data.children.attach(Downgraded).get(), file.id);
        Editor.currentPath.set(path);
    };

    // Graphql hook
    const getFilesNode = useGetFilesNodeHook(rest.pipeline, data, setExpanded, handleFileClick);

    return (
        <div {...rest}>
            <Box>
                <Autocomplete
                    options={workerGroups}
                    getOptionLabel={(option) => option.WorkerGroup}
                    value={workerGroup}
                    onChange={(event, newValue) => {
                        setWorkerGroup(newValue);
                    }}
                    sx={{ '& fieldset': { borderRadius: 0, borderColor: 'editorPage.borderColor' }, '& .MuiAutocomplete-popupIndicator': { color: 'editorPage.fileManagerIcon' } }}
                    renderInput={(params) => <TextField {...params} label="Worker" required size="small" sx={{ fontSize: '.75rem', display: 'flex' }} />}
                />
            </Box>

            <Box
                sx={{
                    backgroundColor: 'background.main',
                    border: 1,
                    borderColor: 'editorPage.borderColor',
                    position: 'absolute',
                    mt: 1,
                    top: 40,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    overflowY: 'scroll',
                }}>
                <Grid container alignItems="center" justifyContent="space-between" sx={{ p: '14px 14px 0' }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                        Files
                    </Typography>
                    <Grid item display="flex" alignItems="center">
                        <IconButton aria-label="New File" onClick={() => handleNewFileIconClick(data.id.get())}>
                            <Box component={FontAwesomeIcon} icon={faFile} sx={{ color: 'editorPage.fileManagerIcon', fontSize: 11 }} />
                        </IconButton>
                        <IconButton aria-label="New Folder" onClick={() => handleNewFolderIconClick(data.id.get())}>
                            <Box component={FontAwesomeIcon} icon={faFolder} sx={{ color: 'editorPage.fileManagerIcon', fontSize: 11 }} />
                        </IconButton>
                    </Grid>
                </Grid>

                <TreeView
                    defaultCollapseIcon={<Box component={FontAwesomeIcon} icon={faChevronDown} style={{ fontSize: '0.875rem' }} sx={{ color: 'editorPage.chevron' }} />}
                    defaultExpandIcon={<Box component={FontAwesomeIcon} icon={faChevronRight} style={{ fontSize: '0.875rem' }} sx={{ color: 'editorPage.chevron' }} />}
                    aria-label=""
                    expanded={expanded}
                    selected={selected}
                    onNodeSelect={handleSelect}
                    onNodeToggle={handleToggle}
                    sx={{
                        height: '100%',
                        flexGrow: 1,
                        maxWidth: 400,
                        overflowY: 'auto',
                        marginLeft: '-12px',
                    }}>
                    {renderTree(data.attach(Downgraded).get())}
                </TreeView>
            </Box>

            {children}
            <CustomDragHandle left={8} />
            <Drawer anchor="right" open={isOpenDelete} onClose={() => setIsOpenDelete(!isOpenDelete)}>
                <DeleteFileFolderDrawer
                    handleClose={() => {
                        setIsOpenDelete(false);
                    }}
                    data={data}
                    selected={selected}
                    nodeID={rest.pipeline.nodeID}
                    pipelineID={rest.pipeline.pipelineID}
                />
            </Drawer>
        </div>
    );
});

export const PYTHON_CODE_EXAMPLE = `import banana
    
    class Monkey:
        # Bananas the monkey can eat
        capacity = 10
        def eat(self, n):
            """Make the monkey eat n bananas!"""
            self.capacity -= n * banana.size
        def feeding_frenzy(self):
            self.eat(9.25)
            return "Yum yum"
`;

const PYTHON_CODE_EXAMPLE_2 = `
    # Define the number set
    numbers = {23, 90, 56, 78, 12, 34, 67}
    
    # Add a new data
    numbers.add(50)
    # Print the set values
    print(numbers)

    message = "Number is not found"

    # Take a number value for search
    search_number = int(input("Enter a number:"))
    # Search the number in the set
    for val in numbers:
        if val == search_number:
            message = "Number is found"
            break

    print(message)
`;

export const FILES_STRUCTURE_MOCK = [
    {
        id: '1',
        name: 'src',
        children: [
            {
                id: '3',
                language: 'python',
                name: 'monkey.py',
                content: PYTHON_CODE_EXAMPLE,
                isEditing: false,
                diffValue: PYTHON_CODE_EXAMPLE,
            },
        ],
    },
    {
        id: '2',
        name: 'dist',
        children: [
            {
                id: '4',
                language: 'python',
                name: 'clear_the_logs.py',
                content: PYTHON_CODE_EXAMPLE_2,
                isEditing: false,
                diffValue: PYTHON_CODE_EXAMPLE_2,
            },
        ],
    },
];

// const MOCK_DATA = {
//     id: MOCK_ROOT_ID,
//     name: 'Files',
//     children: FILES_STRUCTURE_MOCK,
// };

function CustomTreeItem(props) {
    const { label, ...other } = props;

    return (
        <TreeItem
            label={
                <Box>
                    <Typography sx={{ fontWeight: '400', fontSize: 13, flexGrow: 1 }}>{label}</Typography>
                </Box>
            }
            {...other}
        />
    );
}

export default FileManagerColumn;

// ----- Custom hook
export const useGetFilesNodeHook = (pipeline, data, setExpanded, handleFileClick) => {
    const environmentID = pipeline.environmentID;
    const pipelineID = pipeline.pipelineID;
    const nodeID = pipeline.nodeID;

    // GraphQL hook
    const getFilesNode = useGetFilesNode();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get files
    return async () => {
        const response = await getFilesNode({ environmentID, pipelineID, nodeID });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get files: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            const resp = prepareForFrontEnd(response);
            data.set(resp);
            setExpanded([resp.id]);
            handleFileClick(resp.children.filter((a) => a.name === 'dp-entrypoint.py')[0]);
        }
    };
};

const useCreateFolderNodeHook = (pipeline, selected) => {
    const environmentID = pipeline.environmentID;
    const pipelineID = pipeline.pipelineID;
    const nodeID = pipeline.nodeID;

    // Global editor state
    const EditorGlobal = useGlobalEditorState();

    // GraphQL hook
    const createFolderNode = useCreateFolderNode();

    const { enqueueSnackbar } = useSnackbar();

    // Upload file
    return async () => {
        const input = {
            folderID: EditorGlobal.selectedFile.id.value,
            parentID: EditorGlobal.selectedFile.parentID.value,
            environmentID,
            pipelineID,
            nodeID,
            folderName: EditorGlobal.selectedFile.name.value,
            fType: EditorGlobal.selectedFile.fType.value,
            active: true,
        };
        const response = await createFolderNode({ input });

        if (response.status) {
            enqueueSnackbar("Can't get files: " + (response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Folder saved.', { variant: 'success' });
            EditorGlobal.selectedFile.id.set(response.folderID);
            EditorGlobal.selectedFile.isEditing.set(false);
        }
    };
};

const useRenameFileHook = (pipeline, data, setExpanded) => {
    const environmentID = pipeline.environmentID;
    const pipelineID = pipeline.pipelineID;
    const nodeID = pipeline.nodeID;

    // GraphQL hook
    const renameFile = useRenameFile();

    const { enqueueSnackbar } = useSnackbar();

    // Rename file
    return async (element) => {
        const newName = element.name;
        const fileID = element.id;

        const response = await renameFile({ environmentID, pipelineID, nodeID, fileID, newName });

        if (response.r || response.error) {
            enqueueSnackbar("Can't rename file: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            const resp = prepareForFrontEnd(response);
            data.set(resp);
            setExpanded([resp.id]);
        }
    };
};

const useRenameFolderHook = (pipeline, data, setExpanded) => {
    const environmentID = pipeline.environmentID;
    const pipelineID = pipeline.pipelineID;
    const nodeID = pipeline.nodeID;

    // GraphQL hook
    const renameFolder = useRenameFolder();

    const { enqueueSnackbar } = useSnackbar();

    // Rename folder
    return async (element) => {
        const newName = element.name;
        const folderID = element.id;

        const response = await renameFolder({ environmentID, pipelineID, nodeID, folderID, newName });

        if (response.r || response.error) {
            enqueueSnackbar("Can't rename folder: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            const resp = prepareForFrontEnd(response);
            data.set(resp);
            setExpanded([resp.id]);
        }
    };
};

function prepareForFrontEnd(data) {
    const files = JSON.parse(JSON.stringify(data.files).replaceAll('fileID', 'id').replaceAll('fileName', 'name').replaceAll('folderID', 'parentID'));
    const folders = JSON.parse(JSON.stringify(data.folders).replaceAll('folderID', 'id').replaceAll('folderName', 'name'));
    folders.forEach((a) => (a.children = []));
    data = [...files, ...folders];

    if (data.length === 1) {
        data[0].children = [];
        return data[0];
    }

    let parentIDs = data.map((a) => a.id);
    const top = data.filter((a) => !parentIDs.includes(a.parentID))[0];
    let rest = data.filter((a) => parentIDs.includes(a.parentID));

    function recursive(arr, parent) {
        if (arr.length === 0) return;
        let array = [];

        for (const key of rest) {
            if (
                !Object.values(rest)
                    .map((a) => a.id)
                    .includes(key.parentID)
            ) {
                array.push(key);
            }
        }
        parent.children = array;
        rest = rest.filter(
            (a) =>
                !Object.values(array)
                    .map((a) => a.id)
                    .includes(a.id)
        );
    }
    recursive(rest, top);

    function recursive2(arr) {
        if (arr.length === 0) return;

        for (const key of arr) {
            if (
                Object.values(rest)
                    .map((a) => a.parentID)
                    .includes(key.id)
            ) {
                rest.filter((a) => a.parentID === key.id); //?
                recursive2(rest.filter((a) => a.parentID === key.id));
                key.children = rest.filter((a) => a.parentID === key.id);
            }
        }
    }
    recursive2(top.children);
    return top;
}
