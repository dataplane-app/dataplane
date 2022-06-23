### How to run

NB: from root of this repo
```shell
# Remove all volumes
docker-compose -f cypress-docker-compose.yaml down -v

# Build and run
docker-compose -f cypress-docker-compose.yaml up --build
```