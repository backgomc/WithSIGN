# NHSIGN

## 배포
- client 빌드
 > yarn build
- nginx 포트 설정
 > client/nginx/nginx.conf
- docker 설정
 > client/Dockerfile
 > server/Dockerfile
- docker 파일 배포
 > docker-compose up -d
 > docker-compse down 
- docker image 수동으로 추출
 > docker images
 > docker save -o nhsign_server.tar nhsign_server
 > docker save -o nhsign_client.tar nhsign_client
 > docker save -o mongo.tar mongo
- docker image 압축 후 운영서버 전송
- docker image 주입
 > docker load -i nhsign_server.tar
 > docker load -i nhsign_client.tar
 > docker load -i mongo.tar
- 볼륨 설정한 폴더 생성
 > mkdir /저장폴더/Data/mongodb <= DB 저장소
 > mkdir /저장폴더/Data/storage/docToSign <= STORAGE 저장소
- docker-compose 작성 및 서비스 기동 
 > docker-compose up -d