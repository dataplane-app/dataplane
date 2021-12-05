// Code generated by github.com/99designs/gqlgen, DO NOT EDIT.

package model

type AddUsersInput struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	Password  string `json:"password"`
	Timezone  string `json:"timezone"`
}

type Authtoken struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

type Environments struct {
	Name string `json:"name"`
}

type Pipelines struct {
	Name string `json:"name"`
}

type Response struct {
	Msg string `json:"msg"`
}

type Workers struct {
	Name string `json:"name"`
}
