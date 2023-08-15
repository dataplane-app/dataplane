import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../../Auth/UserAuth.jsx';

const graphlqlEndpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    query userSingleDeploymentPermissions($userID: String!, $environmentID: String!, $deploymentID: String!, $subjectType: String!) {
        userSingleDeploymentPermissions(userID: $userID, environmentID: $environmentID, deploymentID: $deploymentID, subjectType: $subjectType) {
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

export const useGetUserSingleDeploymentPermissions = () => {
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
            return res?.userSingleDeploymentPermissions;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
