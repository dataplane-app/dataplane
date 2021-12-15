import { gql, GraphQLClient } from "graphql-request";

const graphlqlEndpoint = "http://localhost:9000/public/graphql"

const LoginUser = gql`
    query loginUser($username: String!, $password: String!){
        loginUser(
                username: $username,
                password: $password
        ) {
                access_token
                refresh_token
        }
    }
`;


export const useLoginUser = () => {    
    const client = new GraphQLClient(graphlqlEndpoint);
  
    return async (input) => {
      try {
        const res = await client.request(LoginUser, input);
        console.log("FROM FILE", res);
        return res?.loginUser;
      } catch (error) {
        return error
      }
    };
  };