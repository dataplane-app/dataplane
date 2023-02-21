### How to run

NB: from root of this repo
```shell
# Remove all volumes
docker-compose -f cypress-docker-compose.yaml down -v

# Build and run
docker-compose -f cypress-docker-compose.yaml up --build

# for already built images
docker-compose -f cypress-dockerbuilt-compose.yaml up

## run all the tests
cd cypress
```
yarn
npx cypress run
```

## open the GUI
```
npx cypress open
```
