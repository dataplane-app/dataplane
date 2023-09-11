import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../../Auth/UserAuth.jsx';

const graphlqlEndpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    mutation deploymentPermissionsToUser($environmentID: String!, $resourceID: String!, $user_id: String!, $access: [String!]!) {
        deploymentPermissionsToUser(environmentID: $environmentID, resourceID: $resourceID, user_id: $user_id, access: $access)
    }
`;

export const useDeploymentPermissionsToUser = () => {
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
            return res?.deploymentPermissionsToUser;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
