#build-stage
FROM --platform=$BUILDPLATFORM node:22-bookworm-slim as build-stage

WORKDIR /app

ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN apt-get update && apt-get install -y git

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
