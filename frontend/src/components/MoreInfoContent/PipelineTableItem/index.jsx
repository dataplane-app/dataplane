import { MenuItem } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useHistory } from 'react-router-dom';
import { useTurnOnOffPipeline } from '../../../graphql/turnOnOffPipeline';
import { useGlobalFlowState } from '../../../pages/Flow';

const PipelineItemTable = (props) => {
    // React router
    const history = useHistory();

    // Global state
    const FlowState = useGlobalFlowState();

    //Props
    const { handleCloseMenu, handleClose, id, name, environmentID, setIsOpenDeletePipeline, nodeTypeDesc, getPipelines } = props;

    // Graphql hook
    const turnOnOffPipeline = useTurnOnOffPipelineHook(id, environmentID, handleClose, getPipelines);

    const manageEdit = () => {
        FlowState.isEditorPage.get(true);
        history.push(`/pipelines/flow/${id}`);
    };

    const permissionClick = () => {
        handleCloseMenu();
        history.push({ pathname: `/pipelines/permissions/${id}`, state: name });
    };

    const deleteClick = () => {
        handleCloseMenu();
        setIsOpenDeletePipeline(true);
    };

    // Handle turn off button
    const handleTurnOffPipeline = () => {
        handleCloseMenu();
        FlowState.isOpenTurnOffPipelineDrawer.set(true);
    };

    // Handle turn on button
    const handleTurnOnPipeline = async () => {
        turnOnOffPipeline(true);
        handleCloseMenu();
    };

    const handleDeploy = () => {
        history.push(`/pipelines/deploy/${id}`);
    };

    return (
        <>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={manageEdit}>
                Edit
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={permissionClick}>
                Permissions
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={handleDeploy}>
                Deploy
            </MenuItem>
            {nodeTypeDesc !== 'play' ? (
                <MenuItem sx={{ color: 'cyan.main' }} onClick={props.online ? handleTurnOffPipeline : handleTurnOnPipeline}>
                    {props.online ? 'Turn off' : 'Turn on'}
                </MenuItem>
            ) : null}
            <MenuItem sx={{ color: 'error.main' }} onClick={deleteClick}>
                Delete
            </MenuItem>
        </>
    );
};

export default PipelineItemTable;

// ------ Custom hook
const useTurnOnOffPipelineHook = (pipelineID, environmentID, handleClose, getPipelines) => {
    // GraphQL hook
    const turnOnOffPipeline = useTurnOnOffPipeline();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Update trigger
    return async (online) => {
        const response = await turnOnOffPipeline({ environmentID, pipelineID, online });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't update trigger: " + response.msg, {
                variant: 'error',
            });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            getPipelines();
            handleClose();
        }
    };
};
