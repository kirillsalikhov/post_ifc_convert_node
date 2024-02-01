FROM node:20-bullseye

COPY docker/converter/ /utils/converter/

WORKDIR /converter

COPY src/ /converter/src/
COPY package.json package-lock.json /converter/
COPY samples/ /converter/samples/

RUN npm ci
