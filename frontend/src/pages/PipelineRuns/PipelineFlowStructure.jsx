import { useSnackbar } from 'notistack';
import { useHistory } from 'react-router-dom';
import { useGetPipelineFlow } from '../../graphql/getPipelineFlow';
import { useGlobalPipelineRun } from './GlobalPipelineRunUIState';
import { prepareInputForFrontend } from '../../utils/PipelinePrepareGraphInput';

/* 
Get the structure for given pipeline ID and environment ID
Set the Elements in Flowstate that updates the graph on page
*/
export const GetPipelineFlow = () => {
    // GraphQL hook
    const getPipelineFlow = useGetPipelineFlow();

    // React router
    const history = useHistory();

    // Global state
    const FlowState = useGlobalPipelineRun();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get members
    return async (inputs) => {
        // console.log("Pipeline ID:", inputs.pipelineId, inputs.environmentID)

        const rawResponse = await getPipelineFlow({ pipelineID: inputs.pipelineId, environmentID: inputs.environmentID });

        // console.log("Get pipeline structure", rawResponse)
        const response = prepareInputForFrontend(rawResponse);

        if (response.length === 0) {
            FlowState.elements.set([]);

            // If there is no elements then navigate to edit pipelines
            history.push(`/pipelines/flow/${inputs.pipelineId}`);
        } else if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get flow: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            FlowState.elements.set(response);
        }
    };
};
