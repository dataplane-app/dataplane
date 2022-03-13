## Setup Kubernetes

1. Install minikube
2. Open kubernetes-dev folder in terminal
3. Install postgresql and nats in this order

```shell
kubectl apply -f nats-deployment.yaml
kubectl apply -f postgresql-storage.yaml
kubectl apply -f postgresql-deploy.yaml
```

4. Deploy worker with skaffold



## Build docker image

Go to root directory of this repo
```shell
docker build -t dataplane/dataplane-worker:latest -f ./kubernetes-dev/Dockerfile.workerpython ./workers
```
