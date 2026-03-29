FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG BASE_HREF=/
ARG PORTAL_ROLE=all

RUN sed -i "s/portalRole: 'all'/portalRole: '${PORTAL_ROLE}'/" public/app-config.js \
  && npm run build -- --configuration production --base-href ${BASE_HREF}

FROM nginx:1.27-alpine
COPY docker/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 80
