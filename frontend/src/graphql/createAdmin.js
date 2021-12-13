import { gql, GraphQLClient } from "graphql-request";

const graphlqlEndpoint = "http://localhost:9000/public/graphql"

const CreateAdminUser = gql`
    mutation createAdminUser($platform: PlatformInput!, $users: AddUsersInput!){
        setupPlatform(
            input: {
                PlatformInput: $platform,
                AddUsersInput: $users
            }
        ) {
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
            Auth{
                access_token
                refresh_token
            }
        }
    }
`;

export const useCreateAdmin = () => {    
    const client = new GraphQLClient(graphlqlEndpoint);
  
    return async (input) => {
      const variables = { input };

      try {
        const res = await client.request(CreateAdminUser, input);
        console.log("FROM FILE", res);
        return res?.setupPlatform;
      } catch (error) {
        console.log("GraphQl request error:", JSON.parse(JSON.stringify(error)).response);
        return JSON.parse(JSON.stringify(error)).response.error;
      }
      // return null;
    };
  };