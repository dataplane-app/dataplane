import { MenuItem } from '@mui/material';
import { useHistory } from 'react-router-dom';
import { useGlobalFlowState } from '../../../pages/Flow';
import { useTurnOnOffPipelineHook } from '../../DrawerContent/TurnOffPipelineDrawer';

const ViewPageItem = (props) => {
    const history = useHistory();

    // Global state
    const FlowState = useGlobalFlowState();

    // Graphql hook
    const turnOnOffPipeline = useTurnOnOffPipelineHook(props.pipeline.pipelineID, props.pipeline.environmentID, props.handleCloseMenu, props.getPipelineFlow);

    // Handle edit button
    const handleGoToEditorPage = () => {
        FlowState.isEditorPage.set(true);
        history.push({ pathname: `/pipelines/flow/${props.pipeline.pipelineID}`, state: props.pipeline });
    };

    // Handle turn off button
    const handleTurnOffPipeline = () => {
        props.handleCloseMenu();
        FlowState.isOpenTurnOffPipelineDrawer.set(true);
    };

    // Handle turn on button
    const handleTurnOnPipeline = () => {
        turnOnOffPipeline(true);
    };

    return (
        <>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={() => props.handleCloseMenu()}>
                Run
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={handleGoToEditorPage}>
                Edit
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={() => props.handleCloseMenu()}>
                Deploy
            </MenuItem>
            {props.pipeline.node_type_desc !== 'play' ? (
                <MenuItem sx={{ color: 'cyan.main' }} onClick={props.isPipelineOnline ? handleTurnOffPipeline : handleTurnOnPipeline}>
                    {props.isPipelineOnline ? 'Turn off' : 'Turn on'}
                </MenuItem>
            ) : null}
        </>
    );
};

export default ViewPageItem;
