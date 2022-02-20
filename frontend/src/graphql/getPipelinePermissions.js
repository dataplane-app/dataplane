import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../Auth/UserAuth';

const graphlqlEndpoint = process.env.REACT_APP_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    query pipelinePermissions($userID: String!, $environmentID: String!, $pipelineID: String!) {
        pipelinePermissions(userID: $userID, environmentID: $environmentID, pipelineID: $pipelineID) {
            ID
            Subject
            SubjectID
            Resource
            ResourceID
            Access
            Active
            EnvironmentID
            Level
            Label
            FirstName
            LastName
            Email
            JobTitle
        }
    }
`;

export const usePipelinePermissions = () => {
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
            return res?.pipelinePermissions;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
