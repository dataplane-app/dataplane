import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../Auth/UserAuth';

const graphlqlEndpoint = process.env.REACT_APP_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    mutation renameFolder($environmentID: String!, $nodeID: String!, $pipelineID: String!, $folderID: String!, $newName: String!) {
        renameFolder(environmentID: $environmentID, nodeID: $nodeID, pipelineID: $pipelineID, folderID: $folderID, newName: $newName)
    }
`;

export const useRenameFolder = () => {
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
            return res?.renameFolder;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
