FROM nginx:stable-alpine

WORKDIR /app 
RUN mkdir ./build
ADD ./build ./build
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf
RUN chmod 755 -R ./build/webfonts 

EXPOSE 3000

# 실행 명령어
CMD ["nginx", "-g", "daemon off;"]