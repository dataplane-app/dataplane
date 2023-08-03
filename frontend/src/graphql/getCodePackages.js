import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../Auth/UserAuth';

const graphlqlEndpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    query getCodePackages($environmentID: String!, $language: String!, $workerGroup: String!, $pipelineID: String!) {
        getCodePackages(environmentID: $environmentID, language: $language, workerGroup: $workerGroup, pipelineID: $pipelineID) {
            workerGroup
            language
            environmentID
            packages
        }
    }
`;

export const useGetCodePackages = () => {
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
            return res?.getCodePackages;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
