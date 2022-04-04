### Build docker image
From root directory of this repo:

```
docker run -p 9001:9000 --rm dataplane/dataplane:0.0.1

docker login

docker build -t dataplane/dataplane-worker-python:0.0.1 -f docker-build/Dockerfile.main.alpine .
docker tag dataplane/dataplane-worker-python:0.0.1 dataplane/dataplane-worker-python:0.0.1
docker tag dataplane/dataplane-worker-python:0.0.1 dataplane/dataplane-worker-python:latest
docker push dataplane/dataplane-worker-python:latest
docker push dataplane/dataplane-worker-python:0.0.1

docker build -t dataplane/dataplane:0.0.1 -f docker-build/Dockerfile.main.alpine .
docker tag dataplane/dataplane:0.0.1 dataplane/dataplane:0.0.1
docker tag dataplane/dataplane:0.0.1 dataplane/dataplane:latest
docker push dataplane/dataplane:latest
docker push dataplane/dataplane:0.0.1
```