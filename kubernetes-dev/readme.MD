## Setup Kubernetes

1. Install minikube
2. Open kubernetes-dev folder in terminal
3. Install postgresql and nats in this order

```shell
kubectl apply -f nats-deployment.yaml
kubectl apply -f postgresql-storage.yaml
kubectl apply -f postgresql-deploy.yaml
```

4. Apply an ingress
```shell
kubectl apply -f dp-ingress.yaml
kubectl get ingress
```
With the IP address add to /etc/hosts file
```
sudo nano /etc/hosts
172.17.0.15 dataplane.info
```

5. Deploy worker with skaffold
From root of this repo run:
```shell
skaffold run -f ./kubernetes-dev/skaffold-main.yaml
skaffold run -f ./kubernetes-dev/skaffold-worker.yaml
```

6. Logging across apps
```shell
brew install stern
stern -n default dataplane-main -t
```



## Build docker image

Go to root directory of this repo
```shell
docker build -t dataplane/dataplane-worker:latest -f ./kubernetes-dev/Dockerfile.workerpython .
```
