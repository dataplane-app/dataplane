import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../Auth/UserAuth';

const graphlqlEndpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    mutation removeRemoteProcessGroupFromEnvironment($environmentID: String!, $remoteProcessGroupID: String!) {
        removeRemoteProcessGroupFromEnvironment(environmentID: $environmentID, remoteProcessGroupID: $remoteProcessGroupID)
    }
`;

export const useRemoveRemoteProcessGroupFromEnvironment = () => {
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
            return res?.removeRemoteProcessGroupFromEnvironment;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
