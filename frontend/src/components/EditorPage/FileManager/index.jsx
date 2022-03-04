import { faChevronDown, faChevronRight, faFile, faFolder } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import TreeItem from '@mui/lab/TreeItem';
import TreeView from '@mui/lab/TreeView';
import { Autocomplete, Box, Grid, IconButton, TextField, Typography } from '@mui/material';
import { forwardRef, useEffect, useState } from 'react';
import { useGlobalEditorState } from '../../../pages/Editor';
import { useGetWorkerGroups_ } from '../../DrawerContent/AddPipelineDrawer';
import { useGlobalEnvironmentState } from '../../EnviromentDropdown';
import { Downgraded } from '@hookstate/core';

const FileManagerColumn = forwardRef(({ children, ...rest }, ref) => {
    // Global environment state with hookstate
    const Environment = useGlobalEnvironmentState();
    const Editor = useGlobalEditorState();

    // Local state
    const [workerGroups, setWorkerGroups] = useState([]);

    // Custom GraphQL hook
    const getWorkerGroups = useGetWorkerGroups_(Environment.name.get(), setWorkerGroups);

    // Get workers on load
    useEffect(() => {
        getWorkerGroups();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFileClick = (file) => {
        console.log(file);

        // Return if it's not a file
        if (file.children && file.children.length > 0) {
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
    };

    const renderTree = (nodes) => {
        return (
            <TreeItem sx={{ mt: 0.5 }} key={nodes.id} nodeId={nodes.id} label={nodes.name} onClick={() => handleFileClick(nodes)}>
                {Array.isArray(nodes.children) ? nodes.children.map((node) => renderTree(node)) : null}
            </TreeItem>
        );
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
                }}>
                <Grid container alignItems="center" justifyContent="space-between" sx={{ p: '14px 14px 0' }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                        Files
                    </Typography>
                    <Grid item display="flex" alignItems="center">
                        <IconButton aria-label="New File">
                            <Box component={FontAwesomeIcon} icon={faFile} sx={{ color: 'editorPage.fileManagerIcon', fontSize: 11 }} />
                        </IconButton>
                        <IconButton aria-label="New File">
                            <Box component={FontAwesomeIcon} icon={faFolder} sx={{ color: 'editorPage.fileManagerIcon', fontSize: 11 }} />
                        </IconButton>
                    </Grid>
                </Grid>

                <TreeView
                    defaultCollapseIcon={<Box component={FontAwesomeIcon} icon={faChevronDown} sx={{ color: 'editorPage.tabTextColorNotActive', fontSize: 10 }} />}
                    defaultExpandIcon={<Box component={FontAwesomeIcon} icon={faChevronRight} sx={{ color: 'editorPage.tabTextColorNotActive', fontSize: 10 }} />}
                    aria-label=""
                    sx={{
                        height: '100%',
                        flexGrow: 1,
                        maxWidth: 400,
                        overflowY: 'auto',

                        p: '0 5px',
                    }}>
                    <TreeItem key="open" nodeId="open" label="Open files" sx={{ mt: 0.6 }}>
                        {Editor.tabs
                            .attach(Downgraded)
                            .get()
                            ?.map((open) => (
                                <TreeItem key={open.id} nodeId={open.id} label={open.name} onClick={() => handleFileClick(open)} />
                            ))}
                    </TreeItem>
                    {renderTree(data)}
                </TreeView>
            </Box>

            {children}
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
                diffValue: '',
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
                diffValue: '',
            },
        ],
    },
];

const data = {
    id: 'all',
    name: 'Files',
    children: FILES_STRUCTURE_MOCK,
};

export default FileManagerColumn;
