FROM node:14-alpine3.12
COPY package*.json /app/
WORKDIR /app
RUN ["npm", "install"]
COPY . .
ENTRYPOINT ["node"]
CMD ["server.js"]