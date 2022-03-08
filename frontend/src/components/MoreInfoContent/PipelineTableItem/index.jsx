import { MenuItem } from '@mui/material';
import { useHistory } from 'react-router-dom';
import { useGlobalFlowState } from '../../../pages/Flow';
import { useTurnOnOffPipelineHook } from '../../DrawerContent/TurnOffPipelineDrawer';

const PipelineItemTable = (props) => {
    // React router
    const history = useHistory();

    // Global state
    const FlowState = useGlobalFlowState();

    // Graphql hook
    const turnOnOffPipeline = useTurnOnOffPipelineHook(props.id, props.environmentID, props.handleClose, props.getPipelines);

    //Props
    const { handleCloseMenu, handleOpenManage, id, name, setIsOpenDeletePipeline } = props;

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
        setIsOpenDeletePipeline(true);
    };

    // Handle turn off button
    const handleTurnOffPipeline = () => {
        props.handleCloseMenu();
        FlowState.isOpenTurnOffPipelineDrawer.set(true);
    };

    // Handle turn on button
    const handleTurnOnPipeline = async () => {
        turnOnOffPipeline(true);
        props.handleCloseMenu();
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
            <MenuItem sx={{ color: 'cyan.main' }} onClick={props.online ? handleTurnOffPipeline : handleTurnOnPipeline}>
                {props.online ? 'Turn off' : 'Turn on'}
            </MenuItem>
            <MenuItem sx={{ color: 'error.main' }} onClick={deleteClick}>
                Delete
            </MenuItem>
        </>
    );
};

export default PipelineItemTable;
