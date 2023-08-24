FROM adoptopenjdk:8-jre

# 환경 변수
ARG SERVER_MODE
ENV MODE=${SERVER_MODE}
ARG JAR_VERSION
ENV FILE=${JAR_VERSION}

WORKDIR /app 
COPY ./build/libs/${FILE} .
RUN mkdir ./lib
COPY ./lib/Fcwpackager_1.2.3.0_linux64_nocert_20220405.tar.gz ./lib
RUN mkdir ./fsdinit
COPY ./fsdinit ./fsdinit

EXPOSE 4001

# DRM 라이브러리 및 환경 설정 (hostid - dc0a5b8d)
RUN tar -zxvf /app/lib/Fcwpackager_1.2.3.0_linux64_nocert_20220405.tar.gz -C /app/lib
ENV LD_LIBRARY_PATH=/app/lib
COPY hostid /etc

# 실행 명령어
CMD java -Dserver.mode=${MODE} -jar ${FILE}
