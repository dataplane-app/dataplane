
### Using NATS CLI

```shell
nats context add nats --server localhost:14222 --description "NATS Dataplane" --select

nats sub <channel>

nats pub <channel> "message"

nats sub js.out.testing --ack 

# wildcard use
nats sub "workertask.*"
```

### Measure execution time in milliseconds in Postgresql
```sql
SELECT
  task_id,
  "status",
  start_dt,
  end_dt,
  Extract(epoch FROM (end_dt - start_dt))*1000 AS milliseconds,
  Extract(epoch FROM (end_dt - start_dt)) AS seconds
FROM worker_tasks 
where end_dt >'0001-01-01'
order by created_at desc;
```