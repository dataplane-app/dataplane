### How to run

Be sure to run from root of this repo. front end needs to be built outside of devcontainer.
```
cd frontend 
yarn
yarn build
cd app/mainapp
go run TestCypress/CypressTest.go
```

Run the Cypress tests inside