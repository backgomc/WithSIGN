# ISSUE
* [1]
POST /api/storage/upload 500 2.646 ms - 243
Error: ENOENT: no such file or directory, open 'storage/docToSign/60efdfa5ebb01b001337ffc91626337309475.pdf'
>  /Data/storage/docToSign 폴더가 생성되어있어야 한다. docToSign 폴더도 !!!
* [2]
bcrypt_lib.node is not a valid Win32 application
> const bcrypt = require("bcrypt"); for const bcrypt = require("bcryptjs"); and npm i bcryptjs --save
* [3]
pdf 가 한장인 경우 PDF뷰어 높이가 여백이 많이 생기는 문제 발생 
* [4]  엣지 예전버전에서 <></> <Space></Space>에 값이 없는 경우 출력이 안됨 (DocumentExpander)
> Space 에 옵션을 일단 줘 봄
* [5] ie 에서 SSO 페이지 오류 
> NH_SSO.js 에 console.log 가 ie 에서 안먹힘, Mozilla 로 통과시 ie 도 통과되므로 태블릿 체크는 다른 방법으로 해야함
* [6] edge 87 아래 버전에서 텍스트 박스가 있으면 스크립트 오류 나는 문제
> edge 버전 업데이트 가이드 해주기 
* [7] 유효성 체크 문제 > 서명 값만 현재 유효성 체크를 하고 있어 텍스트 박스는 유효성 체크를 안해서 누락되는 문제가 발생
* [8] 모바일 화면에서 문서뷰가 안되는 문제
> 다운로드 체크 필드가 모바일 사이즈의 경우 안넘어와서 나타났던 문제
* [9] ERROR [3/7] RUN apt-get update && apt-get install -y openjdk-11-jdk (At least one invalid signature was encountered. )
> docker 용량 문제로 install 이 안되는 문제, 아래 명령어를 통해 container 용량을 정리해준다.
> docker image prune -f
> docker container prune -f
* [10] Uncaught (in promise) Error: Invariant failed: A state mutation was detected between dispatches
> redux state 값을 mutable 하게 변경하여 나타난 오류로 객체를 copy 하여 사용하여 해결함.