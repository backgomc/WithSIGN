FROM node:16

# RUN apt-get update || : && apt-get install python -y
# RUN apt-get update && apt-get install -y openjdk-11-jdk
RUN apt update -y && apt-get install -y software-properties-common && \
    apt-add-repository 'deb http://archive.debian.org/debian-security stretch/updates main' && \
    apt update -y && apt-get install -y openjdk-8-jdk-headless && \
    apt-get clean

WORKDIR /app 
COPY package.json /app
RUN npm install
COPY . /app

# 실행 명령어
CMD ["npm", "run", "backend"]