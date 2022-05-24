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