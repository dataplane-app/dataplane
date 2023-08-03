import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../Auth/UserAuth';

const graphlqlEndpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    mutation updatePipeline($name: String!, $environmentID: String!, $pipelineID: String!, $description: String!, $workerGroup: String!) {
        updatePipeline(name: $name, environmentID: $environmentID, pipelineID: $pipelineID, description: $description, workerGroup: $workerGroup)
    }
`;

export const useUpdatePipeline = () => {
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
            return res?.updatePipeline;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
