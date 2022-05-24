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
    Assign/              - 서명 참여자 설정
    Lists/               - 문서 목록
    MergeAnnotations/    - PDF Merge (입력 컴포넌트와 원본 PDF 합치기)
    PasswordReset/       - 비밀번호 재설정
    PrepareDocument/     - 문서 서명 요청 편집 (서명 및 텍스트 추가)
    Profile/             - Profile information and a sign out button
    SignDocument/        - 문서 서명
    UploadDocument/      - 문서 파일 업로드 
    Login/               - 로그인
    Register/            - 회원 가입
    ViewDocument/        - 문서 조회
    Step/                - 문서 서명 요청 순서
    MySign/              - 내 서명 목록 및 추가 
    Intl/                - 멀티 랭귀지 지원 
    Footer/              - 화면 하단 공통
    Header/              - 화면 상단 공통
    Landing/             - 대시보드 (첫 화면)
  config/menu.js         - 사이드 메뉴 
  util/                  - 공통 유틸 
  assets/                - css, images, 다국어 지원 리소스 등 
  App              - 레이아웃 및 인증처리 
  index            - Entry point and configuration for React-Redux
  tools/           - Helper function to copy over PDFTron dependencies into /public on post-install
```

- server
```
  common/         - 공통 유틸
  config/         - 프로젝트 설정 값 (개발/운영)
  middleware/     - 사용자 인증 공통
  models/         - MongoDB Model
  public/mock     - 샘플 데이터
  routes/         - 라우팅 및 로직 처리
  index.js        - entry point
```

## Database Structure
- Document
  - _id - string - 문서 고유 ID
  - docRef - string - pdf 스토리지 저장 경로 
  - user - string - 서명 요청자 ID
  - users - an array of strings - 서명 해야할 유저 ID 목록
  - signed - boolean - 서명 완료 상태 
  - signedBy - [string, TimeStamp] - 서명한 시간
  - requestedTime - TimeStamp - 서명 요청 시간
  - docTitle - string - 문서 제목
  - xfdf - [string] - 유저 별 서명 및 입력한 value 값
```
_id: "60dea7c97339d905696a41d7"
docRef: docToSign/c4Y72M0d0pZx3476jxJFxrFA3Qo21593036106369.pdf"
user: "60dea7c97339d905696a41d7"
users: ["60dea7c97339d905696a41d7", "12dea7c97339d905696a41d7"]
signed: false
signedBy: [{user: "60dea7c97339d905696a41d7", signedTime: July 17, 2020 at 12:01:24 PM UTC-7}]
requestedTime: July 17, 2020 at 12:01:24 PM UTC-7
docTitle: "보안서약서"
xfdf: ["<?xml version="1.0" encoding="UTF-8" ?><xfdf xmlns="http://ns.adobe.com/xfdf/" xml:space="preserve">...</xfdf>"]
 ```
 
- User
  - _id - string - 사용자 고유 ID
  - uid - string - 사번/이메일 기반 ID
  - name - string - 이름
  - email - string - 이메일
  - password - string - 비밀번호
  - token - string - 로그인 토큰
  - role - string - 권한 (관리자: 1, 일반: 0)
  - DEPART_CODE - string - 부서코드
  - JOB_TITLE - string - 직명
  - OFFICE_CODE - string - 회사코드(사무소코드)
```
"role": 0,
"_id": "60dbfeb557e078050836b473",
"email": "abc@naver.com",
"password": "...",
"name": "홍길동",
"token": "eyJhbGciOiJIUzI1NiJ9.NjBkYmZlYjU1N2UwNzgwNTA4MzZiNDcz.vkSUWaKfoixDfQMpbTCwyrnrS-Jx0DADBneLFgeifXY",
"DEPART_CODE": "A15800",
"JOB_TITLE": "차장",
"uid": "3b358edc99e9e5b2f80ef8d7c8b59fb20000603e79d19402124691331456adc5",
"OFFICE_CODE": "7831"
 ```
 

- Template
  - _id - string - 템플릿 고유 ID
  - user - string - 템플릿 생성자
  - docTitle - string - 템플릿명
  - docRef - string - 템플릿 고유 경로
  - registeredTime - TimeStamp - 등록 시간
```
"_id": "61020d6d94af350531b56bd8",
"user": {
    "_id": "60dbfeb557e078050836b473",
    "name": "박세현",
    "JOB_TITLE": "차장"
},
"docTitle": "개인정보취급자 보안서약서",
"docRef": "template/60dbfeb557e078050836b4731627524461421.pdf",
"registeredTime": "2021-07-29T02:07:41.440Z"
 ```
 
- Org
  - _id - string - 기관 고유 ID
  - OFFICE_NAME - string - 회사명(사무소명)
  - OFFICE_CODE - string - 회사코드
  - DEPART_CODE - string - 부서코드
  - DEPART_NAME - string - 부서명
  - PARENT_NODE_ID - string - 부모코드
  - DISPLAY_ORDER - string - 디스플레이 순서
```
"_id": "60e648c4e87d550581211bf9",
"OFFICE_NAME": "농협정보시스템",
"OFFICE_CODE": "7831",
"DEPART_CODE": "A11000",
"DEPART_NAME": "경영전략부",
"PARENT_NODE_ID": "B20000",
"DISPLAY_ORDER": 1
 ```


## DOCKER 배포
- client 빌드
 > yarn build
- nginx 포트 설정
 > client/nginx/nginx.conf
- docker 설정
 > client/Dockerfile
 > server/Dockerfile 
- docker 파일 배포
 > docker-compose build --no-cache (패키지 추가된 경우)
 > docker-compose up -d
 > docker-compse down 
- docker image 수동으로 추출
 > docker images
 > docker save -o nhsign_server.tar nhsign_server
 > docker save -o nhsign_web.tar nhsign_web
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
 

## 운영 배포
- 분할 압축
>  tar cvfz - nhsign_server.tar | split -b 470m - nhsign_server.tar.gz
- 분할 압축 풀기
> cat nhsign_server.tar.gz* | tar xvfz -
