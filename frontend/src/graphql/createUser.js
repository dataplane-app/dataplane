import { gql, GraphQLClient } from "graphql-request";
import { useGlobalAuthState } from "../Auth/UserAuth";

const graphlqlEndpoint = process.env.REACT_APP_GRAPHQL_ENDPOINT_PRIVATE

const CreateUser = gql`
 mutation createUser($input: AddUsersInput!){
     createUser(input: $input)
        {
           user_id
           first_name
	         last_name
	         email
	         timezone
        }
 }
`;

export const useCreateUser = () => {   
    const authState = useGlobalAuthState();
    const jwt = authState.authToken.get();

    const headers = {
      Authorization: "Bearer " + jwt,
    };
  
    const client = new GraphQLClient(graphlqlEndpoint, {
      headers,
    });
  
    return async (input) => {
      try {
        const res = await client.request(CreateUser, input);
        return res?.createUser;
      } catch (error) {
        return JSON.parse(JSON.stringify(error, undefined, 2)).response
      }
    };
}