### Count and delete long lists

```
mkdir -p /home/testfiles/
ls /home/testfiles/ | wc -l
time find /home/testfiles/ -name "*.json" -delete 

or better:
cd /home/testfiles/
time find . -delete 

This deletes the directory too:
time find /home/testfiles/ -delete 

cd /appdev/app/mainapp/play/files
time go run createfiles.go
```