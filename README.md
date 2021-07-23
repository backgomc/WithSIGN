# NHSIGN

## RUN 
- server
```
npm run backend
```
- client
```
npm run start
```

## Project structure
- client
```
src/
  app/             - Redux Store Configuration
  components/      - React components
    Assign/              - Add users to a document that needs to be signed 
    Lists/               - List components to list files for signing and review
    MergeAnnotations/    - Merge all signatures and flatten them onto a PDF 
    PasswordReset/       - Reset password
    PrepareDocument/     - Drag and drop signatures, text fields onto a PDF to prepare it for signing
    Profile/             - Profile information and a sign out button
    SignDocument/        - Sign PDF
    Login/               - Sign in
    Register/            - Sign up
    ViewDocument/        - Review document after signing
    Assign               - Component combines Profile and Assign
    Header               - Header when the user is not logged in
    Preparation          - Component combines Profile and PrepareDocument
    Sign                 - Component combines Profile and SignDocument
    View                 - Component combines Profile and ViewDocument
    Welcome              - Component combines Profile, SignList, Preparation, SignedList
  App              - Configuration for navigation, authentication
  index            - Entry point and configuration for React-Redux
  tools/           - Helper function to copy over PDFTron dependencies into /public on post-install
```

## Document Structure
```
_id: "60dea7c97339d905696a41d7"
docRef: docToSign/c4Y72M0d0pZx3476jxJFxrFA3Qo21593036106369.pdf"
user: "60dea7c97339d905696a41d7"
users: ["60dea7c97339d905696a41d7", "12dea7c97339d905696a41d7"]
signed: false
signedBy: ["60dea7c97339d905696a41d7"]
requestedTime: July 17, 2020 at 12:01:24 PM UTC-7
signedTime: July 17, 2020 at 12:01:24 PM UTC-7
docTitle: "보안서약서"
xfdf: ["<?xml version="1.0" encoding="UTF-8" ?><xfdf xmlns="http://ns.adobe.com/xfdf/" xml:space="preserve">...</xfdf>"]
 ```
 
- _id - string - unique identifier for the requestor of the signature
- docRef - string - storage reference to the actual PDF
- user - string - email of the requestor of the signature
- users - an array of strings - users to sign the document
- signed - boolean - value for whether or not all users have signed the document (gets determined by checking lengths of emails array and xfdf array)
- requestedTime - TimeStamp - value for when the signature was requested
- signedTime - TimeStamp - value for when the document was signed
- docTitle - string - value of document title
- xfdf - an array of strings - signature appearance/form field values for each user


## RUN DOCKER
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