import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../../Auth/UserAuth.jsx';

const graphlqlEndpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    mutation stopCERun($pipelineID: String!, $environmentID: String!, $runID: String!, $nodeTypeDesc: String!) {
        stopCERun(pipelineID: $pipelineID, environmentID: $environmentID, runID: $runID, nodeTypeDesc: $nodeTypeDesc)
    }
`;

export const useStopCERun = () => {
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
            return res?.stopCERun;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
