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

# Recurring schedules
Based on RRule - playground: https://jakubroztocil.github.io/rrule/
Examples: 
```
Every 30 seconds only perform 4:
FREQ=SECONDLY;INTERVAL=30;COUNT=4
```

# Github contributions

- Make sure fork is in sync with main repo
- Make sure local is in sync with remote

if an error occurs do the following in Github desktop
1. Right click the commit before the error and create branch from that commit (this rebaselines to a point in time before an error)
2.  Cherry pick the commits into the new rebaselined branch (if need be)

If main is affected both remote and local do the following
```shell
# The first will reset the local branch to previous commit. You can get the commit hash on Github Desktop if you click on the hash, there a button to copy
 git reset --hard <commit-hash>
 # The second will overwrite the remote with this new reset
 git push -f origin main
```

# Pipeline notes
- Version and name need to be unique
- By default all files and folders in code-files will be versioned and synced
- Start date and time is part of rrule
- Map steps in pipeline to worker groups - this should create a mapping of which folders/versions to move to worker nodes
- Pipeline checks
    - The pipeline is formed correctly
    - Steps found in pipeline are also in steps
    - The graph is acyclical