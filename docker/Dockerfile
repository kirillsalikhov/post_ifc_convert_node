FROM node:20-bullseye

COPY docker/converter/ /utils/converter/

WORKDIR /converter

COPY package.json package-lock.json /converter/
RUN npm ci

COPY src/ /converter/src/
