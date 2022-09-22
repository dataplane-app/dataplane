### Notes and checklist on implementation

1. Make sure new platform gets a default storage of database
2. If default storage is not found in platform table - run migration to database
3. Both code files and deployment files

### How it works

* Each node in graph has its own set of files. 
* Those files are downloaded to the worker per node at the time of run. 
* This is then cached by reference to Database

### When
- [x] New or edited file - simply add to database, invalidate node level cache and this will automatically added by reference to cache on run time.
- [ ] Delete a file, move file or folder name change - invalidate the node cache, remove all file level cache and remove the entire folder in each worker.
- [ ] Pipeline change - invalidate the node cache (all nodes in pipeline), remove all file level cache and remove the entire folder in each worker.

### Testing
* When LocalFile - files created in shared volume
* When Database - no files in shared volume
* On migration - no breaking changes
- [ ] Duplicate a pipeline
- [x] Create a pipeline
- [ ] Edit a pipeline
- [ ] Deploy a pipleline
- [x] Delete a folder in a node
- [x] Rename a folder in a node
- [ ] Move a folder
- [x] Create or amend a file
- [ ] Multi worker group pipeline
- [x] Relative imports in python folders work