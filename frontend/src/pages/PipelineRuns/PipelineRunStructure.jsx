import { useSnackbar } from 'notistack';
import { useGetSinglepipelineRunAndTasks } from '../../graphql/pipelines/getSinglepipelineRunAndTasks.js';
import { useGlobalPipelineRun } from './GlobalPipelineRunUIState';

/* 
Get the structure for a pipeline run
*/
export const GetPipelineRun = () => {
    const { enqueueSnackbar } = useSnackbar();
    const FlowState = useGlobalPipelineRun();
    const getPipelineRun = useGetSinglepipelineRunAndTasks();

    return async (pipelineID, runID, environmentID, isNewFlow) => {
        // Get single pipelines run and statuses
        let [singleRunResponse] = await getPipelineRun({
            pipelineID: pipelineID,
            runID: runID,
            environmentID: environmentID,
        });

        if (singleRunResponse.length === 0) {
            // setSelectedRun([]);
        } else if (singleRunResponse.r || singleRunResponse.error) {
            enqueueSnackbar("Can't get pipeline run: " + (singleRunResponse.msg || singleRunResponse.r || singleRunResponse.error), { variant: 'error' });
        } else if (singleRunResponse.errors) {
            singleRunResponse.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            // Only set the elements with the info from run if there isn't a new flow
            !isNewFlow && FlowState.elements.set(singleRunResponse.run_json);
            return singleRunResponse;
        }
    };
};
