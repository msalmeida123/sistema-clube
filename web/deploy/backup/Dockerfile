FROM postgres:17-alpine
RUN apk add --no-cache nodejs tar
WORKDIR /worker
COPY worker.cjs ./worker.cjs
CMD ["node","worker.cjs"]
