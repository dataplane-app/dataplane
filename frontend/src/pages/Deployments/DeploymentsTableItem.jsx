import { MenuItem } from '@mui/material';
import { useHistory } from 'react-router-dom';
import { useGlobalFlowState } from '../Flow';
import { useTurnOnOffDeploymentHook } from './TurnOffDeploymentDrawer';

const DeploymentTableItem = (props) => {
    // React router
    const history = useHistory();

    // Global state
    const FlowState = useGlobalFlowState();

    //Props
    const { handleCloseMenu, id, name, online, environmentID, nodeTypeDesc, setIsOpenDeletePipeline, getDeployments } = props;

    // Graphql hook
    const turnOnOffDeployment = useTurnOnOffDeploymentHook(id, environmentID, handleCloseMenu, getDeployments);

    const permissionClick = () => {
        handleCloseMenu();
        history.push({ pathname: `/pipelines/permissions/${id}`, state: name });
    };

    const deleteClick = () => {
        handleCloseMenu();
        setIsOpenDeletePipeline(true);
    };

    // Handle turn off button
    const handleTurnOffDeployment = () => {
        handleCloseMenu();
        FlowState.isOpenTurnOffPipelineDrawer.set(true);
    };

    // Handle turn on button
    const handleTurnOnDeployment = async () => {
        turnOnOffDeployment(true);
        handleCloseMenu();
    };

    return (
        <>
            {nodeTypeDesc !== 'play' ? (
                <MenuItem sx={{ color: 'cyan.main' }} onClick={online ? handleTurnOffDeployment : handleTurnOnDeployment}>
                    {online ? 'Turn off' : 'Turn on'}
                </MenuItem>
            ) : null}
            <MenuItem sx={{ color: 'cyan.main' }} onClick={permissionClick}>
                Permissions
            </MenuItem>
            <MenuItem sx={{ color: 'error.main' }} onClick={deleteClick}>
                Delete
            </MenuItem>
        </>
    );
};

export default DeploymentTableItem;
