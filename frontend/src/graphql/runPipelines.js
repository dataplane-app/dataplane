import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../Auth/UserAuth';

const graphlqlEndpoint = process.env.REACT_APP_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    mutation runPipelines($pipelineID: String!, $environmentID: String!, $RunType: String!) {
        runPipelines(pipelineID: $pipelineID, environmentID: $environmentID, RunType: $RunType) {
            run_id
            pipeline_id
            status
            environment_id
            created_at
            ended_at
            updated_at
        }
    }
`;

export const useRunPipelines = () => {
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
            return res?.runPipelines;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
