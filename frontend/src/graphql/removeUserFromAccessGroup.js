import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../Auth/UserAuth';

const graphlqlEndpoint = process.env.REACT_APP_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    mutation removeUserFromAccessGroup($environmentID: String!, $user_id: String!, $access_group_id: String!) {
        removeUserFromAccessGroup(environmentID: $environmentID, user_id: $user_id, access_group_id: $access_group_id)
    }
`;

export const useRemoveUserFromAccessGroup = () => {
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
            return res?.removeUserFromAccessGroup;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
