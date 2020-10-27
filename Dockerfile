FROM node:14-alpine3.12
COPY package*.json /app/
RUN ["npm", "install"]
COPY . ./app
WORKDIR /app
ENTRYPOINT ["nodejs"]
CMD ["app.js"]