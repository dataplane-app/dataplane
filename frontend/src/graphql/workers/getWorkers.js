import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../../Auth/UserAuth.jsx';

const graphlqlEndpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    query getWorkers($environmentID: String!) {
        getWorkers(environmentID: $environmentID) {
            WorkerGroup
            WorkerID
            Status
            T
            Interval
            CPUPerc
            Load
            MemoryPerc
            MemoryUsed
            Env
            LB
            WorkerType
        }
    }
`;

export const useGetWorkers = () => {
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
            return res?.getWorkers;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
