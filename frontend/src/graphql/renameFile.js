import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../Auth/UserAuth';

const graphlqlEndpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    mutation renameFile($environmentID: String!, $nodeID: String!, $pipelineID: String!, $fileID: String!, $newName: String!) {
        renameFile(environmentID: $environmentID, nodeID: $nodeID, pipelineID: $pipelineID, fileID: $fileID, newName: $newName)
    }
`;

export const useRenameFile = () => {
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
            return res?.renameFile;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
