import { useEffect, useState } from 'react';
import { Box, Typography, Button, Grid } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useSnackbar } from 'notistack';
import { useGlobalEnvironmentState } from '../../EnviromentDropdown';
import { Downgraded } from '@hookstate/core';
import { findNodeById, isFolder, removeById } from '../../EditorPage/FileManager/functions';
import { useGlobalEditorState } from '../../../pages/Editor';
import { useDeleteFolderNode } from '../../../graphql/deleteFolderNode';
import { useParams } from 'react-router-dom';
import { useDeleteFileNode } from '../../../graphql/deleteFileNode';

const DeleteFileFolderDrawer = ({ handleClose, data, selected, nodeID, pipelineID }) => {
    const Editor = useGlobalEditorState();

    const { closeSnackbar } = useSnackbar();

    // Local state
    const [file, setIsFile] = useState(true);
    const [elementToBeDeleted, setElementToBeDeleted] = useState([]);

    // Set local state on load
    useEffect(() => {
        closeSnackbar();
        setIsFile(!isFolder(selected, data.attach(Downgraded).get()));
        setElementToBeDeleted(findNodeById(data.children.attach(Downgraded).get(), selected));

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Graphql hooks
    const deleteFolder = useDeleteFolderNodeHook(nodeID, selected, pipelineID);
    const deleteFile = useDeleteFileNodeHook(nodeID, selected, pipelineID);

    const handleDelete = async () => {
        // Delete from the database
        if (file) {
            const resp = await deleteFile();
            // If not successful, file isn't deleted from the tree
            if (resp !== 'Success') return;
        } else {
            const resp = await deleteFolder();
            // If not successful, folder isn't deleted from the tree
            if (resp !== 'Success') return;
        }

        // Delete from the tree
        const removed = removeById(data.children.attach(Downgraded).get(), selected);
        data.children.set(removed);

        // Remove child from tabs
        if (elementToBeDeleted?.children && elementToBeDeleted?.children.length > 0) {
            const tabs = Editor.tabs.attach(Downgraded).get();
            const newTabs = removeById(tabs, elementToBeDeleted.children[0].id);
            checkLastTab(newTabs);
        } else {
            const tabs = Editor.tabs.attach(Downgraded).get();
            const newTabs = removeById(tabs, elementToBeDeleted.id);
            checkLastTab(newTabs);
        }

        handleClose();
    };

    // Util
    const checkLastTab = (newTabs) => {
        if (newTabs.length === 0) {
            Editor.selectedFile.set(null);
        } else {
            Editor.selectedFile.set(newTabs[newTabs.length - 1]);
        }

        Editor.tabs.set(newTabs);
    };

    return (
        <Box position="relative">
            <Box sx={{ p: '4.125rem' }}>
                <Box position="absolute" top="26px" right="39px" display="flex" alignItems="center">
                    <Button variant="text" onClick={handleClose} style={{ paddingLeft: '16px', paddingRight: '16px' }} startIcon={<FontAwesomeIcon icon={faTimes} />}>
                        Close
                    </Button>
                </Box>

                <Typography component="h2" variant="h2">
                    Delete {file ? 'file' : 'folder'} - {elementToBeDeleted?.name}
                </Typography>

                <Typography variant="body2" sx={{ mt: 2 }}>
                    You are about to delete a {file ? 'file' : 'folder'}, would you like to continue?
                </Typography>

                <Grid mt={4} display="flex" alignItems="center">
                    <Button onClick={handleDelete} variant="contained" color="primary" sx={{ mr: 2 }}>
                        Yes
                    </Button>
                    <Button onClick={handleClose} variant="contained" color="primary">
                        No
                    </Button>
                </Grid>

                <Typography variant="body2" sx={{ mt: 4 }} color="rgba(248, 0, 0, 1)">
                    Warning: this action can't be undone.
                </Typography>
            </Box>
        </Box>
    );
};

export default DeleteFileFolderDrawer;

// ------ Custom hooks
const useDeleteFolderNodeHook = (nodeID, selected, pipelineID) => {
    // GraphQL hook
    const deleteFolder = useDeleteFolderNode();

    // Global environment state
    const Environment = useGlobalEnvironmentState();

    const { enqueueSnackbar } = useSnackbar();

    // Delete folder
    return async () => {
        const response = await deleteFolder({ environmentID: Environment.id.get(), pipelineID, nodeID, folderID: selected });

        if (response.r || response.error) {
            enqueueSnackbar("Can't delete folder: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            return 'Success';
        }
    };
};

const useDeleteFileNodeHook = (nodeID, selected, pipelineID) => {
    // GraphQL hook
    const deleteFile = useDeleteFileNode();

    // Global environment state
    const Environment = useGlobalEnvironmentState();

    const { enqueueSnackbar } = useSnackbar();

    // Delete file
    return async () => {
        const response = await deleteFile({ environmentID: Environment.id.get(), pipelineID, nodeID, fileID: selected });

        if (response.r || response.error) {
            enqueueSnackbar("Can't delete file: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            return 'Success';
        }
    };
};
