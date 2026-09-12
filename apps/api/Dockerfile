FROM golang:1.27-alpine

WORKDIR /app

RUN go install github.com/air-verse/air@latest

COPY apps/api/go.mod apps/api/go.sum apps/api/
RUN go mod download -C apps/api

COPY apps/api ./apps/api

WORKDIR /app/apps/api

EXPOSE 8080

CMD ["air", "-c", ".air.toml"]
