#build-stage
FROM --platform=$BUILDPLATFORM node:24-bookworm-slim as build-stage

WORKDIR /app

ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN apt-get update && apt-get install -y git

COPY package.json package-lock.json ./

RUN npm install --ignore-scripts

COPY . .

RUN npm run postinstall

RUN npm run build


#production-stage
FROM nginx:stable-alpine as production-stage

COPY --from=build-stage /app/build /usr/share/nginx/html

COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Writes REACT_* env vars to runtime-env.js on container start, so they can be
# changed without rebuilding the image.
COPY --chmod=0755 ./nginx/runtime-env.sh /docker-entrypoint.d/40-care-runtime-env.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
