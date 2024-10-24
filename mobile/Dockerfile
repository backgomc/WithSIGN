FROM nginx

WORKDIR /app 
RUN mkdir ./build
ADD ./build ./build
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf


EXPOSE 3004

# 실행 명령어
CMD ["nginx", "-g", "daemon off;"]