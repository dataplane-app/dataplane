import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../../Auth/UserAuth.jsx';

const graphlqlEndpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    query userDeploymentPermissions($userID: String!, $environmentID: String!, $subjectType: String!) {
        userDeploymentPermissions(userID: $userID, environmentID: $environmentID, subjectType: $subjectType) {
            Access
            Subject
            SubjectID
            PipelineName
            ResourceID
            EnvironmentID
            Active
            Level
            Label
            FirstName
            LastName
            Email
            JobTitle
        }
    }
`;

export const useGetUserDeploymentPermissions = () => {
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
            return res?.userDeploymentPermissions;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
