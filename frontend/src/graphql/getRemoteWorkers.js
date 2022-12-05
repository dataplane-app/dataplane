import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../Auth/UserAuth';

const graphlqlEndpoint = process.env.REACT_APP_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    query getRemoteWorkers($environmentID: String!, $remoteProcessGroupID: String) {
        getRemoteWorkers(environmentID: $environmentID, remoteProcessGroupID: $remoteProcessGroupID) {
            workerID
            workerName
            description
            status
            active
            lastPing
        }
    }
`;

export const useGetRemoteWorkers = () => {
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
            return res?.getRemoteWorkers;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
