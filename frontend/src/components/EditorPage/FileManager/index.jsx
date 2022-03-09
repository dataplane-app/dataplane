import { faChevronDown, faChevronRight, faExpandArrowsAlt, faFile, faFolder, faPencilAlt, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import TreeItem from '@mui/lab/TreeItem';
import TreeView from '@mui/lab/TreeView';
import { Autocomplete, Box, Grid, IconButton, TextField, Typography } from '@mui/material';
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { useGlobalEditorState } from '../../../pages/Editor';
import { useGetWorkerGroupsHook } from '../../DrawerContent/AddPipelineDrawer';
import { useGlobalEnvironmentState } from '../../EnviromentDropdown';
import { faFileAlt } from '@fortawesome/free-regular-svg-icons';
import { v4 as uuidv4 } from 'uuid';
import { useSnackbar } from 'notistack';
import { findNodeById, findNodeByName, getParentId, getPath } from './functions';

const MOCK_ROOT_ID = 'all';

const FileManagerColumn = forwardRef(({ children, ...rest }, ref) => {
    // Global environment state with hookstate
    const Environment = useGlobalEnvironmentState();
    const Editor = useGlobalEditorState();
    const { enqueueSnackbar } = useSnackbar();

    // Local state
    const [workerGroups, setWorkerGroups] = useState([]);
    const [selected, setSelected] = useState(null);
    const [expanded, setExpanded] = useState([]);
    const [data] = useState(MOCK_DATA);

    // File/folder creation states
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newFileName, setNewFileName] = useState('');
    const [newFolderName, setNewFolderName] = useState('');
    const [whatTypeIsCreating, setWhatTypeIsCreating] = useState('file');

    // Local ref
    const newFileRef = useRef();

    // Check if user clicked outside when adding a new file/folder
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (newFileRef.current && !newFileRef.current.contains(event.target)) {
                setIsAddingNew(false);
            }
        };
        document.addEventListener('click', handleClickOutside, true);
        return () => {
            document.removeEventListener('click', handleClickOutside, true);
        };
    }, []);

    // Mui Tree functions
    const handleToggle = (event, nodeIds) => {
        setExpanded(nodeIds);
    };

    const handleSelect = (event, nodeIds) => {
        setSelected(nodeIds);
    };

    // Custom GraphQL hook
    const getWorkerGroups = useGetWorkerGroupsHook(Environment.name.get(), setWorkerGroups);

    // Get workers on load
    useEffect(() => {
        getWorkerGroups();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle ESC key press when adding a new file
    const escFunction = useCallback((event) => {
        if (event.keyCode === 27) {
            setIsAddingNew(false);
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
    const handleNewFileIconClick = () => {
        setIsAddingNew(true);
        setWhatTypeIsCreating('file');

        window.setTimeout(() => {
            if (newFileRef) {
                newFileRef?.current?.focus();
            }
        }, 100);

        checkLevel();
        expandFolder();
    };

    // Triggers when the user is typing a file name
    const handleNewFileDone = (e) => {
        // Check if enter has being pressed
        if (e.charCode === 13) {
            const check = checkFileName(newFileName);
            const alreadyExistsFile = findNodeByName(data?.children, newFileName);

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
            id: uuidv4(),
            name: newFileName,
            language: undefined,
            content: ``,
            isEditing: false,
            diffValue: ``,
        };

        // Push new file to root children
        //Find the ID first
        const currentSelectedElement = findNodeById(data.children, selected);
        if (selected === MOCK_ROOT_ID) {
            data.children.push(newFileMock);
        } else if (currentSelectedElement && currentSelectedElement.children) {
            currentSelectedElement.children.push(newFileMock);
            selectAndOpenNewFile(newFileMock);
        } else {
            return;
        }

        // Success snack
        enqueueSnackbar(`File ${newFileName} create!`, { variant: 'success' });

        // Set values to default
        setNewFileName('');
        setIsAddingNew(false);
    };

    // Folder
    // Triggers when user click on the new folder icon
    const handleNewFolderIconClick = () => {
        setIsAddingNew(true);
        setWhatTypeIsCreating('folder');

        window.setTimeout(() => {
            if (newFileRef) {
                newFileRef?.current?.focus();
            }
        }, 100);

        checkLevel();
        expandFolder();
    };

    // Triggers when the user is typing a folder name
    const handleNewFolderDone = (e) => {
        // Check if enter has being pressed
        if (e.charCode === 13) {
            const check = checkFolderName(newFolderName);
            const alreadyExistsFolder = findNodeByName(data?.children, newFolderName);

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
            id: uuidv4(),
            name: newFolderName,
            children: [],
        };

        // Push new file to root children
        //Find the ID first
        const currentSelectedElement = findNodeById(data.children, selected);
        if (selected === MOCK_ROOT_ID) {
            data.children.push(newFolderMock);
        } else if (currentSelectedElement && currentSelectedElement.children) {
            currentSelectedElement.children.push(newFolderMock);
            selectAndOpenNewFile(newFolderMock);
        } else {
            return;
        }

        // Success snack
        enqueueSnackbar(`Folder ${newFolderName} create!`, { variant: 'success' });

        // Set values to default
        setNewFolderName('');
        setIsAddingNew(false);
    };

    // ####### Utils ########
    // Checks if selected folder is expanded
    const expandFolder = () => {
        if (!selected || selected === MOCK_ROOT_ID) {
            if (expanded?.filter((id) => id === MOCK_ROOT_ID).length > 0) {
                return;
            } else {
                setExpanded([...expanded, MOCK_ROOT_ID]);
                setSelected(MOCK_ROOT_ID);
            }
        } else {
            if (expanded?.filter((id) => id === selected).length > 0) {
                return;
            } else {
                setExpanded([...expanded, selected]);
            }
        }
    };

    // Check if it is folder of file
    const checkLevel = () => {
        if (!selected || selected === MOCK_ROOT_ID) return;

        const selectedInfo = findNodeById(data.children, selected);
        if (selectedInfo) {
            if (selectedInfo.children) {
                // Is folder\
                return false;
            } else {
                // Is file
                const closestParentID = getParentId(data.children, selected);
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

    // Render files and folders to UI
    const renderTree = (nodes) => {
        return (
            <CustomTreeItem
                className="tree_parent"
                sx={{ mt: 0.5, position: 'relative' }}
                icon={!nodes.children && <Box component={FontAwesomeIcon} icon={faFileAlt} sx={{ color: 'editorPage.tabTextColorNotActive', fontSize: 5 }} />}
                key={nodes.id}
                nodeId={nodes.id}
                label={nodes.name}
                onClick={() => handleFileClick(nodes)}>
                <Box className={`${nodes.id === MOCK_ROOT_ID ? 'showOnHover' : ''} hidden_controls tree-${nodes.id}`}>
                    <IconButton aria-label="Edit File" onClick={() => {}}>
                        <Box component={FontAwesomeIcon} icon={faPencilAlt} sx={{ color: 'editorPage.fileManagerIcon', fontSize: 9 }} />
                    </IconButton>
                    <IconButton aria-label="New File" onClick={handleNewFileIconClick}>
                        <Box component={FontAwesomeIcon} icon={faFileAlt} sx={{ color: 'editorPage.fileManagerIcon', fontSize: 9 }} />
                    </IconButton>
                    <IconButton aria-label="New Folder" onClick={handleNewFolderIconClick}>
                        <Box component={FontAwesomeIcon} icon={faFolder} sx={{ color: 'editorPage.fileManagerIcon', fontSize: 9 }} />
                    </IconButton>
                    <IconButton aria-label="Remove folder">
                        <Box component={FontAwesomeIcon} icon={faTimes} sx={{ color: 'editorPage.fileManagerIcon', fontSize: 9 }} />
                    </IconButton>
                </Box>
                {Array.isArray(nodes.children)
                    ? nodes.children.map((node) => {
                          return renderTree(node);
                      })
                    : null}
                {nodes.id === selected && isAddingNew ? (
                    <input
                        onKeyPress={whatTypeIsCreating === 'file' ? handleNewFileDone : handleNewFolderDone}
                        ref={newFileRef}
                        style={{ width: '90%', marginLeft: 10 }}
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

        // Check if file is alreay open
        if (prevTabs.filter((tab) => tab.id === file.id).length > 0) {
            Editor.selectedFile.set(file);
            return;
        }

        Editor.selectedFile.set(file);
        Editor.tabs.set((prevTabs) => [...prevTabs, file]);

        // Set file path
        const path = getPath(data.children, selected);
        console.log(selected);
        Editor.currentPath.set(path);

        console.log(path);
    };

    return (
        <div {...rest}>
            <Box>
                <Autocomplete
                    options={workerGroups}
                    getOptionLabel={(option) => option.WorkerGroup}
                    renderInput={(params) => <TextField {...params} label="Worker" required size="small" sx={{ fontSize: '.75rem', display: 'flex' }} />}
                />
            </Box>

            <Box
                sx={{
                    backgroundColor: 'background.main',
                    border: '1px solid  #D3D3D3',
                    borderRadius: '7px',
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
                        <IconButton aria-label="New File" onClick={handleNewFileIconClick}>
                            <Box component={FontAwesomeIcon} icon={faFile} sx={{ color: 'editorPage.fileManagerIcon', fontSize: 11 }} />
                        </IconButton>
                        <IconButton aria-label="New Folder" onClick={handleNewFolderIconClick}>
                            <Box component={FontAwesomeIcon} icon={faFolder} sx={{ color: 'editorPage.fileManagerIcon', fontSize: 11 }} />
                        </IconButton>
                    </Grid>
                </Grid>

                <TreeView
                    defaultCollapseIcon={<Box component={FontAwesomeIcon} icon={faChevronDown} sx={{ color: 'editorPage.tabTextColorNotActive', fontSize: 5 }} />}
                    defaultExpandIcon={<Box component={FontAwesomeIcon} icon={faChevronRight} sx={{ color: 'editorPage.tabTextColorNotActive', fontSize: 5 }} />}
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

                        p: '0 5px',
                    }}>
                    {renderTree(data)}
                </TreeView>
            </Box>

            {children}
            <Box sx={{ position: 'absolute', bottom: 2, left: 5, cursor: 'pointer' }}>
                <Box component={FontAwesomeIcon} icon={faExpandArrowsAlt} className="drag-handle" />
            </Box>
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

const MOCK_DATA = {
    id: MOCK_ROOT_ID,
    name: 'Files',
    children: FILES_STRUCTURE_MOCK,
};

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
