import { gql, GraphQLClient } from "graphql-request";
import { useGlobalAuthState } from "../Auth/UserAuth";

const graphlqlEndpoint = process.env.REACT_APP_GRAPHQL_ENDPOINT_PRIVATE

const GetUsers = gql`
    query getUsers(){
      getUsers{
                user_id
	              user_type
	              first_name
	              last_name
	              email
	              job_title
	              timezone
                status
        }
    }
`;

export const useGetUsers = () => { 
    const authState = useGlobalAuthState();
    const jwt = authState.authToken.get();

    const headers = {
      Authorization: "Bearer " + jwt,
    };
  
    const client = new GraphQLClient(graphlqlEndpoint, {
      headers,
    });
  
    return async () => {
      try {
        const res = await client.request(GetUsers);
        return res?.getUsers;
      } catch (error) {
        return JSON.parse(JSON.stringify(error, undefined, 2)).response
      }
    };
  };