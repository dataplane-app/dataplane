import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../../Auth/UserAuth.jsx';

const graphlqlEndpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    query filesNode($environmentID: String!, $nodeID: String!, $pipelineID: String!) {
        filesNode(environmentID: $environmentID, nodeID: $nodeID, pipelineID: $pipelineID) {
            folders {
                folderID
                parentID
                folderName
                level
                fType
                active
            }
            files {
                fileID
                folderID
                fileName
                level
                fType
                active
            }
        }
    }
`;

export const useGetFilesNode = () => {
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
            return res?.filesNode;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
