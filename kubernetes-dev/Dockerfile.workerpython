FROM golang:1.18-alpine as builder

RUN mkdir -p /go/src/build

WORKDIR /go/src/build

COPY app/go.mod .
COPY app/go.sum .
RUN go mod download

ADD app /go/src/build/

ARG SKAFFOLD_GO_GCFLAGS
RUN go build -gcflags="${SKAFFOLD_GO_GCFLAGS}" -o dataplane-worker workers/worker.go


FROM python:alpine3.15

RUN apk update && apk add --no-cache git ca-certificates tzdata && update-ca-certificates

# Create appuser
ENV USER=appuser
ENV UID=10001
ARG GITHUB_USER
ARG GITHUB_TOKEN

RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/workerdev" \
    --shell "/sbin/nologin" \
#    --no-create-home \
    --uid "${UID}" \
    "${USER}"


COPY --from=builder go/src/build/dataplane-worker /workerdev/dataplane-worker
WORKDIR /workerdev

# COPY ../workers/go.mod /workerdev/go.mod
# RUN go mod download

# Use an unprivileged user.
ENV GOTRACEBACK=single
USER appuser:appuser

CMD ["dataplane-worker"]