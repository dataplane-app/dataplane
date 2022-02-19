import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../Auth/UserAuth';

const graphlqlEndpoint = process.env.REACT_APP_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    mutation pipelinePermissionsToUser($environmentID: String!, $resource: String!, $resourceID: String!, $user_id: String!, $access: String!, $checked: String!) {
        pipelinePermissionsToUser(environmentID: $environmentID, resource: $resource, resourceID: $resourceID, user_id: $user_id, access: $access, checked: $checked)
    }
`;

export const usePipelinePermissionsToUser = () => {
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
            return res?.pipelinePermissionsToUser;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
