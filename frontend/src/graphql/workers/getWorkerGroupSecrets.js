import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../../Auth/UserAuth.jsx';

const graphlqlEndpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    query getWorkerGroupSecrets($environmentID: String!, $WorkerGroup: String!) {
        getWorkerGroupSecrets(environmentID: $environmentID, WorkerGroup: $WorkerGroup) {
            Secret
            SecretType
            Description
            EnvVar
            Active
            EnvironmentId
        }
    }
`;

export const useGetWorkerGroupSecrets = () => {
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
            return res?.getWorkerGroupSecrets;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
