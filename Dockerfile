FROM node:12.14.0-alpine

RUN mkdir /app
WORKDIR /app

COPY ./package.json /app/package.json

RUN npm install

COPY ./src /app/src

CMD ["node", "./src/server.js"]