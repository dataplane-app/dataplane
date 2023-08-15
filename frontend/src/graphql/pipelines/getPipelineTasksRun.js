import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../../Auth/UserAuth.jsx';

const graphlqlEndpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    query pipelineTasksRun($pipelineID: String!, $runID: String!, $environmentID: String!) {
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

export const usePipelineTasksRun = () => {
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
            return res?.pipelineTasksRun;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
