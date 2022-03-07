import { MenuItem } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useHistory } from 'react-router-dom';
import { useDeletePipeline } from '../../../graphql/deletePipeline';
import { useGlobalEnvironmentState } from '../../EnviromentDropdown';

const PipelineItemTable = (props) => {
    // React router
    const history = useHistory();

    //Props
    const { handleCloseMenu, handleOpenManage, id, name, getPipelines } = props;

    // Graphql hook
    const deletePipeline = useDeletePipelineHook();

    const manageClick = () => {
        handleCloseMenu();
        handleOpenManage();
    };

    const permissionClick = () => {
        handleCloseMenu();
        history.push({ pathname: `/pipelines/permissions/${id}`, state: name });
    };

    const deleteClick = () => {
        handleCloseMenu();
        deletePipeline(props.id, getPipelines);
    };

    return (
        <>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={manageClick}>
                Edit
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={permissionClick}>
                Permissions
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={() => props.handleCloseMenu()}>
                Deploy
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={() => props.handleCloseMenu()}>
                Turn off
            </MenuItem>
            <MenuItem sx={{ color: 'error.main' }} onClick={deleteClick}>
                Delete
            </MenuItem>
        </>
    );
};

export default PipelineItemTable;

const useDeletePipelineHook = () => {
    // GraphQL hook
    const deletePipeline = useDeletePipeline();

    // Global environment state
    const Environment = useGlobalEnvironmentState();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Delete pipeline
    return async (pipelineID, getPipelines) => {
        const response = await deletePipeline({ environmentID: Environment.id.get(), pipelineID });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't delete pipeline: " + response.msg, {
                variant: 'error',
            });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getPipelines();
        }
    };
};
