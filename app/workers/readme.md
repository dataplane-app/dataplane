
### Using NATS CLI

```shell
nats context add nats --server localhost:14222 --description "NATS Dataplane" --select

nats sub <channel>

nats pub <channel> "message"

nats sub js.out.testing --ack 

# wildcard use
nats sub "workertask.*"
```