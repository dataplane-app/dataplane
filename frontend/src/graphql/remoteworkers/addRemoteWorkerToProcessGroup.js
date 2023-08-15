import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../../Auth/UserAuth.jsx';

const graphlqlEndpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    mutation addRemoteWorkerToProcessGroup($environmentID: String!, $workerID: String!, $remoteProcessGroupID: String!) {
        addRemoteWorkerToProcessGroup(environmentID: $environmentID, workerID: $workerID, remoteProcessGroupID: $remoteProcessGroupID)
    }
`;

export const useAddRemoteWorkerToProcessGroup = () => {
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
            return res?.addRemoteWorkerToProcessGroup;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
