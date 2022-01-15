### Build docker image
From root directory of this repo:

```
docker build -t dataplane/dataplane:dev-0.0.1 -f docker/Dockerfile.alpine .

docker run -p 9001:9000 --rm dataplane/dataplane:0.0.1

docker login
docker tag dataplane/dataplane:0.0.1 dataplane/dataplane:dev-0.0.1
docker push dataplane/dataplane:dev-0.0.2
```