import { MenuItem } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useHistory } from 'react-router-dom';
import { useClearFileCacheDeployment } from '../../graphql/clearFileCacheDeployment';
import { useGetDeployments } from '../../graphql/getDeployments';
import { useGlobalFlowState } from '../PipelineEdit';
import { useTurnOnOffDeploymentHook } from './TurnOffDeploymentDrawer';

const DeploymentTableItem = (props) => {
    // React router
    const history = useHistory();

    // Global state
    const FlowState = useGlobalFlowState();

    //Props
    const { handleCloseMenu, id, name, online, environmentID, nodeTypeDesc, setIsOpenDeletePipeline, setDeployments, deploy_active } = props;

    // Graphql hook
    const getDeployments = useGetDeploymentsHook(setDeployments, environmentID);
    const turnOnOffDeployment = useTurnOnOffDeploymentHook(id, environmentID, handleCloseMenu, getDeployments);
    const clearFileCacheDeployment = useClearFileCacheDeploymentHook(environmentID, id);

    const permissionClick = () => {
        handleCloseMenu();
        history.push({ pathname: `/deployments/permissions/${id}`, state: name });
    };

    const deleteClick = () => {
        handleCloseMenu();
        setIsOpenDeletePipeline(true);
    };

    // Handle turn off button
    const handleTurnOffDeployment = () => {
        handleCloseMenu();
        FlowState.isOpenTurnOffDeploymentDrawer.set(true);
    };

    // Handle turn on button
    const handleTurnOnDeployment = async () => {
        turnOnOffDeployment(true);
        handleCloseMenu();
    };

    const clearCacheClick = () => {
        clearFileCacheDeployment();
        handleCloseMenu();
    };

    return (
        <>
            {nodeTypeDesc !== 'play' && deploy_active ? (
                <MenuItem sx={{ color: 'cyan.main' }} onClick={online ? handleTurnOffDeployment : handleTurnOnDeployment}>
                    {online ? 'Turn off' : 'Turn on'}
                </MenuItem>
            ) : null}
            <MenuItem sx={{ color: 'cyan.main' }} onClick={permissionClick}>
                Permissions
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={clearCacheClick}>
                Clear file cache
            </MenuItem>
            <MenuItem sx={{ color: 'error.main' }} onClick={deleteClick}>
                Delete
            </MenuItem>
        </>
    );
};

export default DeploymentTableItem;

function useGetDeploymentsHook(setDeployments, environmentID) {
    // GraphQL hook
    const getPipelines = useGetDeployments();

    const { enqueueSnackbar } = useSnackbar();

    // Get deployments
    return async () => {
        const response = await getPipelines({ environmentID });
        if (response.r || response.error) {
            enqueueSnackbar("Can't get deployments: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setDeployments(response);
        }
    };
}

function useClearFileCacheDeploymentHook(environmentID, deploymentID) {
    // GraphQL hook
    const clearFileCacheDeployment = useClearFileCacheDeployment();

    const { enqueueSnackbar } = useSnackbar();

    // Clear file cache
    return async () => {
        const response = await clearFileCacheDeployment({ environmentID, deploymentID });

        if (response.r || response.error) {
            enqueueSnackbar("Can't clear file cache: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
        }
    };
}
