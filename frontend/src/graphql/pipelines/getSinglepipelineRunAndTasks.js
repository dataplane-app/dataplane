import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../../Auth/UserAuth.jsx';

const graphlqlEndpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    query getSinglepipelineRun($pipelineID: String!, $environmentID: String!, $runID: String!) {
        getSinglepipelineRun(pipelineID: $pipelineID, environmentID: $environmentID, runID: $runID) {
            run_id
            pipeline_id
            status
            environment_id
            run_json
            created_at
            ended_at
        }
        pipelineTasksRun(pipelineID: $pipelineID, runID: $runID, environmentID: $environmentID) {
            environment_id
            run_id
            worker_group
            worker_id
            pipeline_id
            node_id
            start_dt
            end_dt
            status
            reason
        }
    }
`;

export const useGetSinglepipelineRunAndTasks = () => {
    const authState = useGlobalAuthState();
    const jwt = authState.authToken.get();

    const headers = {
        Authorization: 'Bearer ' + jwt,
    };

    const client = new GraphQLClient(graphlqlEndpoint, {
        headers,
    });

    return async (input) => {
        try {
            const res = await client.request(query, input);
            return [res?.getSinglepipelineRun, res?.pipelineTasksRun];
        } catch (error) {
            let getSinglepipelineRun = error.response.data?.getSinglepipelineRun || error.response;
            let pipelineTasksRun = error.response.data?.pipelineTasksRun || error.response;
            return [getSinglepipelineRun, pipelineTasksRun];
        }
    };
};
