import { gql, GraphQLClient } from 'graphql-request';

const graphlqlEndpoint = process.env.REACT_APP_GRAPHQL_ENDPOINT_PUBLIC;

const query = gql`
    query loginUser($username: String!, $password: String!) {
        loginUser(username: $username, password: $password) {
            access_token
            refresh_token
        }
    }
`;

export const useLoginUser = () => {
    const client = new GraphQLClient(graphlqlEndpoint);

    return async (input) => {
        try {
            const res = await client.request(query, input);
            return res?.loginUser;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
