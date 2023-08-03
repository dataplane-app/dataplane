import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../Auth/UserAuth';

const graphlqlEndpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    mutation pipelinePermissionsToAccessGroup($environmentID: String!, $resourceID: String!, $access_group_id: String!, $access: [String!]!) {
        pipelinePermissionsToAccessGroup(environmentID: $environmentID, resourceID: $resourceID, access_group_id: $access_group_id, access: $access)
    }
`;

export const usePipelinePermissionsToAccessGroup = () => {
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
            return res?.pipelinePermissionsToAccessGroup;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
