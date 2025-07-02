FROM node:16
WORKDIR /app
COPY package.json yarn.lock .npmrc ./
RUN yarn install --ignore-engines
COPY . .
EXPOSE 3000
CMD ["yarn", "start"]