FROM node:15

WORKDIR /app 
COPY package.json /app
RUN npm install
COPY . /app

# 실행 명령어
CMD ["npm", "run", "start"]