### Notes

Logout uses access token derived from the refresh token. This removes all refresh tokens belonging to that user on logout.

### Run tests
```
go test -count=1 -timeout=15s ./... -v -p 1
```

# Update graphql schemas

```
# Public routes
cd mainapp/graphql/public

# Private routes
cd mainapp/graphql/private

go run github.com/99designs/gqlgen generate
```

# Front end notes
Use node 16 outside the container
```
npm install -g n
sudo n install 16.8.0
n 16.8.0
```