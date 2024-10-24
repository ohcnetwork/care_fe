#build-stage
FROM --platform=$BUILDPLATFORM node:20-buster-slim as build-stage

WORKDIR /app

ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN apt-get update && apt-get install -y git

RUN if [ "$(uname -m)" = "aarch64" ] || [ "$(uname -m)" = "arm64" ]; then apt-get install -y python3-dev make g++; fi


COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN npm run build


#production-stage
FROM nginx:stable-alpine as production-stage

COPY --from=build-stage /app/build /usr/share/nginx/html

COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
