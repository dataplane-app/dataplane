### Build docker image

## NB: From root directory of this repo (not this directory):

```
docker run -p 9001:9000 --rm dataplane/dataplane:0.0.2

docker login

## NB: From root directory of this repo (not this directory):
export dpversion=0.0.x

docker build -t dataplane/dataplane:$dpversion -f docker-build/Dockerfile.main.alpine .
docker tag dataplane/dataplane:$dpversion dataplane/dataplane:$dpversion
docker tag dataplane/dataplane:$dpversion dataplane/dataplane:latest
docker push dataplane/dataplane:latest
docker push dataplane/dataplane:$dpversion

docker build -t dataplane/dataplane-worker-python:$dpversion -f docker-build/Dockerfile.workerpython.debian .
docker tag dataplane/dataplane-worker-python:$dpversion dataplane/dataplane-worker-python:$dpversion
docker tag dataplane/dataplane-worker-python:$dpversion dataplane/dataplane-worker-python:latest
docker push dataplane/dataplane-worker-python:latest
docker push dataplane/dataplane-worker-python:$dpversion
```