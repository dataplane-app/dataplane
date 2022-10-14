### Python setup 
```
# Specify the location to pip.conf
export PIP_CONFIG_FILE=/dataplane/pip.conf
```

Specify location for pip modules to be installed in pip.conf
```
[global]
target=/dataplane/pip-packages/
```

Check drive usage -h = friendly size, looking for usage of tmpfs
```
df -h
```

Where is python looking for dependencies
```
python -m site
```

### Release steps
```
1. Merged pull request into main after manual test
2. Merge pull request to cypress-test, wait for tests to complete
3. Merge pull request into release to create a new release to docker
```

### Analysing docker size
```
brew install dive
dive <image tag>
```

## Monitor Postgresql Database connections
```
select max_conn,used,res_for_super,max_conn-used-res_for_super res_for_normal 
from 
  (select count(*) used from pg_stat_activity) t1,
  (select setting::int res_for_super from pg_settings where name=$$superuser_reserved_connections$$) t2,
  (select setting::int max_conn from pg_settings where name=$$max_connections$$) t3
```

### Count files in dir
```
ls /appdev/code-files/ | wc -l
```


### Build docker image

## NB: From root directory of this repo (not this directory):

```
docker run -p 9001:9000 --rm dataplane/dataplane:0.0.2

docker login

## NB: From root directory of this repo (not this directory):
export dpversion=0.0.x

docker build -t dataplane/dataplane:$dpversion -f docker-build/Dockerfile.main.alpine .
docker tag dataplane/dataplane:$dpversion dataplane/dataplane:$dpversion
docker push dataplane/dataplane:$dpversion
docker tag dataplane/dataplane:$dpversion dataplane/dataplane:latest
docker push dataplane/dataplane:latest


docker build -t dataplane/dataplane-worker-python:$dpversion -f docker-build/Dockerfile.workerpython.debian .
docker tag dataplane/dataplane-worker-python:$dpversion dataplane/dataplane-worker-python:$dpversion
docker push dataplane/dataplane-worker-python:$dpversion
docker tag dataplane/dataplane-worker-python:$dpversion dataplane/dataplane-worker-python:latest
docker push dataplane/dataplane-worker-python:latest
```

Test
```
docker run -rm -p 9003:9000 --name dataplane-main dataplane/dataplane:0.0.11
```