import { gql, GraphQLClient } from 'graphql-request';

const graphlqlEndpoint = process.env.REACT_APP_GRAPHQL_ENDPOINT_PUBLIC;

const query = gql`
    mutation createAdminUser($platform: PlatformInput!, $users: AddUsersInput!) {
        setupPlatform(input: { PlatformInput: $platform, AddUsersInput: $users }) {
            Platform {
                id
                business_name
                timezone
                complete
            }
            User {
                user_id
                user_type
                first_name
                last_name
                email
                job_title
                timezone
            }
            Auth {
                access_token
                refresh_token
            }
        }
    }
`;

export const useCreateAdmin = () => {
    const client = new GraphQLClient(graphlqlEndpoint);

    return async (input) => {
        try {
            const res = await client.request(query, input);
            console.log('FROM FILE', res);
            return res?.setupPlatform;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
