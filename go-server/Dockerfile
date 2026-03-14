FROM golang:1.21-alpine AS builder

WORKDIR /app

COPY go-server/go.mod go-server/go.sum ./
RUN go mod download

COPY go-server/ .
RUN go build -o server .

FROM alpine:3.19

WORKDIR /app

COPY --from=builder /app/server .
COPY index.html .

RUN mkdir -p downloads zips

EXPOSE 7229

CMD ["./server"]
