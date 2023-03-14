# Creates the Silent-producer, uploading all AVRO schemas to the Kafka schema registry.
#
# You can access the container using:
#   docker run -it silent-producer sh
# To start it stand-alone:
#   docker run -it silent-producer

FROM nikolaik/python-nodejs as builder
RUN mkdir -p ./code
COPY package.json /code/package.json
WORKDIR /code
RUN npm i
COPY ./tsconfig.json .
COPY ./src/silent-producer.mts ./src/silent-producer.mts
RUN npm run build

FROM node:18-alpine
RUN mkdir -p /app
WORKDIR /app
COPY ./src/schemas ./src/schemas
COPY ./package.json ./package.json
COPY --from=builder /code/dist .
COPY package.json ./package.json
RUN npm i --omit=dev
CMD ["node", "silent-producer.mjs"]
