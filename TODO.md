# 회원가입 (O)
# auth 처리 - 모든 화면 이동에서 처리되게 ... (O)
* 소스 리팩트룅 
# antd 레이아웃 적용 (O)
* antd Landing page 셋팅하기
# 로그인 UI (O)
# 회원가입 UI (O)
# 문서 목록 - 게시판 페이징 (O)
* Loading 바 처리 및 통신 모음 
* 사이드메뉴 모바일 지원 https://github.com/sunnut/react-easy-start
# 테이블 페이징 참조 https://codesandbox.io/s/ydt04?file=/index.js:622-632 (O)
* email 기반 로직을 uid기반으로 변경하기??? => 고민 필요 .. 외부 이용자도 사용할려면 email을 key값으로 하는게 맞다...
# 사인 목록에서 유저 정보 조인하기 populate ....  (O)
# 서명한 목록 조회 버튼 넣기 (O)
# 날짜처리 (O)
# 문서 제목 필드 추가하기 (O)
* 서명 진행정보 조회 
* 문서 메뉴를 2개로 구성하는게 나을지, 한개로 구성하는게 나을지
* 문서 타이틀 클릭시 테이블 확장 - 문서조회, 서명이력조회

* 서명 요청 | 서명할 문서 | 내 문서 

* 문서 상태값 나타내기 :
  - 내 서명 필요: O
  - 완료된 문서: O 
  - 상대서명대기중: 나는서명했지만 상대방은 안한 문서
  - 서명취소됨(거절|시간만료) : 서명참여자중 한명이라도 거절했거나 시간만료된 문서
  - 요청취소됨: 본인이 작성하여 보낸 서명요청한 문서를 취소  
  * 내가 서명참여자가 아니어도 서명요청을 할 수 있으므로 작성자 ID도 포함해서 리스트 출력 필요
* 사용자 선택화면
* 사인화면 편집 
* 필터 검색 DB 방식 처리
* 사용자별로 사인한 시간 따로 저장하기
* 상태 필터링 DB 베이스로 변환하기 
* 서명 이력 조회 (테이블 확장해서 쓰자)
* Descriptions 컬럼 백그라운드 컬러 지정하기, 항목 사이즈 지정하기 
# 복수 사인 지정시 두번째 사람은 사인항목이 안나오는 문제 
# 파일업로드가 완료되면 넘어가도로 변경 
# 사인항목의 email을 uid로 key값 변경하기
* annotation 수정 안되게 하기
* 서명 요청 프로세스 - 파일업로드 (폼에 값을 수동으로 어떻게 컨트롤 하는지 ...)


# 07.07
# saveDocument 시 로딩 바 추가 
* saveDocument 시 필드 빈 항목 체크 
* 사인해야할 문서 갯수 리스트 메뉴에 출력하기 
* 임직원 데이터 사용자 선택하기 
* 템플릿 기능 구현
* antd pro 화면에 항목 웹뷰어 출력해보기

# 07.08
# tree 구조에 직원정보 넣기 
# tree 사용자 검색 기능
# tree에서 조직은 선택된게 안넘어가도록 변경

# 07.12
# 사번 또는 이메일을 암호화해서 별도키값으로 동작하게 변경 => populate 가 ObjectID만 지원을해서 로그인시만 사번,이메일 변환키값 사용
* 반응형 UI 화면 대응 - IE10 에서 사용 가능한 건 없다 ... 
# 내부망 서비스 업로드를 위해 docker 배포를 시도해보자 ...
* docker image 내부망에 실제로 올려보기 

# 07.15
* docker 이미지 용량을 줄이기 
* docker image 수동 배포 및 테스트 ex)docker save -o nhsign_server.tar nhsign_server / docker load -i 경로 및 파일
* 재컴파일이 필요하다....dockerignore 처리함 (node_modules)

# 07.16
* antd component https://ant.design/components/overview/
* antd pro 적용해보자. https://pro.ant.design/   https://procomponents.ant.design/components/layout/

# 07.20
# firebase 삭제
# antdPro 적용 - 파일 업로드, 사용자 선택
# 문서 업로드 이전화면 이동 시 데이터 넣어주기 
* 문서 목록도 ProCard 입히기 
# 문서 목록 상세 화면 만들기 

# 07.23
* 메인 대시보드 만들기

# 07.26
* 템플릿 개발

# 08.24
# 문서목록 모바일 대응
# 사인하기 antd 레이아웃 적용
* 서명 취소 기능
# 홈화면 최대 글수 제한 및 화면 표시 높이 맞추기 
# 서명 취소 기능


# 08.30
# 설정 화면 

# 09.24
# 대량 발송 개발
# Document 를 같이 사용할 것인가 ? O
# - 서명할 문서를 같이 보여주기 위해서 같이 사용 필요함 
# - 내 문서함에 대량 발송 리스트 목록은 안보여줘야 함 
# - SignDocument 에 벌크방식은 별도로 파일 저장하도록 변경 필요 
# 스토리지 날짜별 저장
# 버튼 더블 클릭 방지 : 버튼에 로딩 기능 추가하기 
# DocumentList에 defaultFilteredValue 가 안먹힘 => responsive 옵션을 붙이면 defaultFilteredValue 가 안먹힘
# 대시보드 화면 개선 
* 사용자 프로필 이미지 개발

# 10.18
# 대량 발송 멤버 전체 선택 기능
# 사인 등록 - 이미지 업로드 기능 
# 게시판 글쓰기 기능
# 회사 템플릿 기능 : 부모에서 자식화면 선택 초기화 기능 구현하기 
# 회사 임직원 데이터 연계 - 배치 프로그램 작성
# 운영 서버(스트리밍) - 서비스 올리기
* 순차 발송 기능
# 문서작성 유효성 체크
* Custom Icon 이미지 적용(로고 등)
* 보안성 심의 - 취약성 점검은 필요없는데 인프라 서버 점검은 검토 ...
# 내부 사업발의 (솔루션 구입을 위해)
# 이미지 작업 요청
# 12월초 결제 예정으로 ... 최종 견적 및 이체 절차 문의
# 서명데이터 이미지 암호화
# FAQ
* 진본 확인 증명서 - hash값 남기기, 블록체인 연동 
# 서명시에 IP 정보도 남기기
# react ie11 오류 해결
# 감사추적증명서 만들기: 한글깨짐 ... 맥북에서 입력한 값만 깨짐 ... 자소 문제 아스키코드 확인 
#  무료 폰트 모음:https://brunch.co.kr/@jmh5531/151
# 약관 동의 - 처음 로그인 시 ...
* 메뉴얼 
# 폰트 적용 - 윈도우에서 화면 깨짐 방지 
# DRM 암호화 해제 연동
* https://www.gettyimagesbank.com/ : 대시보드 이미지 찾기
# PDFTron 결제 프로세스 확인
# 서명할때 유효성 체크 
# 템플릿 PDF 썸네일 이미지 형태로 ... 파일 업로드시 같이 올리자. 리스트에 어떻게 표현할지 고만하자.
# with사인으로 화면 변경 (나무사인, 블록사인, 도지사인)
# paperless 건수 표시 - 서명 완료 시 서명 요청자 건수 업데이트  
# observer 기능 넣기
# 회사 템플릿 기능 템플릿 관리에 같이 넣기
* 체크박스 기능 넣기
# 템플릿 썸네일 윈도우에서 작게 나옴 - 클라이언트 PC마다 해상도가 틀려서 그런듯...
# 썸네일 이미지 스토리지 저장 방식으로 변경 - 대량 발송시 썸네일 모두 복제되므로 비효율적임
# 스토리지 분산 처리 
  - 입력시는 config storageDIR 참조 (server > config > prod.js)
  - DB에 STORAGE_DIR 포함 fullpath 저장
  - 스토리지 위치 변경 시는 config 변경
  - config STORAGE_DIR 변경시 nginx proxy 설정 변경
# 대량발송 후 서명요청시 ... 대량발송 플래그 남아있음
# 대량발송 후 서명 완료 시 서명이 안보임
# 의견 보내기 (Q&A) 대시보드에 ...  + 게시글 내용에 댓글 작업하기 (boardDetail)
* 게시글 html 편집기 기능, 첨부 파일 기능 
* 문서 첨부파일 기능 
* 시작하기 -> 서명하기 또는 대량 발송 선택 팝업 
* 사용자 매뉴얼 페이지
  - 주요 메뉴 소개 
  - 대량 전송
  - 일반 전송 예)회의록 : 1)pdf export 2)pdf upload 3)서명 대상자 지정 4) 입력 컴포넌트 설정 5) 서명 요청 
# PDFTron 계약서 전달 
# 파수 검수확인서 전달
# 게시글 작성 에디터 작업
* 순차서명요청 / 문서수신은 앞에 사인이 다 된 경우에만 노출하기
# 서명 요청 완료 시 본인이 포함된 경우 바로 서명하기 기능
* 서명 취소 건에 대하여 서명 요청자인 경우 문서 삭제 기능 넣기
# 내 문서 목록에 대량 발송 건 포함 여부 체크 
# 대량전송은 컴포넌트 입력 시 숫자가 안나옴
# DRM 문서 적용 
# 로그인 페이지 로고 변경
# 7일 오후에 리뷰 
# https://ui.toast.com/tui-editor 로 에디터 변경
# 조직정보 job 코드로 정렬 다시하기 
# 매뉴얼 md 파일로 실시간 수정가능하게 ...
# 대량 전송 요청일때는 최대 10명 풀기
# 대량 전송 목록 페이징 잘 안됨 - pagination 삭제
# 입력 컴포넌트 텍스트 입력 시 내부망에서 오류 발생 Failed to execute 'send' on 'XMLHttpRequest': Failed to load 'https://www.pdftron.com/webfonts/v2/fonts.json'
* 대량발송 목록 호출시 docs 를 다 가져오는데 ... 건수가 많으면 부하 발생할듯 ... 부하테스트 후 수정 필요
# 전체 템플릿 추가



# 한글 텍스트 입력시 상단 짤림 문제 있음 
# Assign 레벨 늘리기 
# 쪽지, 푸시 일단 빼고 배포 
# 월요일 오전에 메시지 보내기
# 파일 첨부 기능 (수정, 삭제 처리 필요)

# DRM 진본확인 이슈 처리 (파일 다운로드 시 암호화, 진본 확인시 복호화)
# 페이퍼리스 회사 통계 기능 
# 쪽지/알림 기능 ON
# FAQ/안내/공지 내용 채워넣기
# 진본 확인 증명서 우측 상단에 마크 추가하기 

# thumbnail url 이미지로 저장하기
# 셋팅에 thumbnail 이 왜 안불러와 지는건지 ...
# 문서 목록에 참여자 출력
# 단체의 경우 서명 완료 푸시 안보내기
# 진본확인증명서 계속 리프레시 됨
# 대량 전송에 건수 취소건 포함해서 출력

# 일반 서명 10명으로 다시 수정
 docker 컴파일 시 server에 storage 날리기
# 뷰에서 어노테이션 편집 막기 
# 진행중에 취소 항목 나오는 문제 - 서버 수정함 (진행중일때 취소 확인 조건 추가)
# 문서 편집 입력값 필요한것만 
# 대량 요청 문서 강조 
# 재요청 기능
* 템플릿 사용자 및 입력값까지 저장
# 순차 적용 
# 수신 기능 순차 적용
  - 요청시 users 가 혼자인 경우에만 푸시 발송하기 
  - 목록에 수신자인 경우 앞에 서명 사인이 끝났을때만 노출하기 
  - 서명하기에서 수신자 제외 마지막 서명자인 경우 수신자에게 푸시 보내기 
  orderType - A(모두), S(순차) , defalult(A)
  usersOrder - {user, order}
  usersTodo - [user]
* 대량 테스트
# 한글 변환 견적 받기 - 한컴
# 활용사례 #3 - 일일점검 - 일단 보류
# 텍스트 입력 위젯 SignDocument 에서 남이 작성한 내용이 안보임 - 다른 사용자의 위젯은 수정안되도록 변경 필요
# 순차발송인 경우 동차 사용자가 복수인 경우 메시지 반복 발송 문제 
* 일반 사용자 버전 별도 개발: 사용자 선택 (이메일 또는 SMS), 약관 동의, 서버 구성

# 월별 통계 쿼리 작성
# 진본 확인 기능 개선 - 요청자 ip 기록 추가, 서명/수산자 구분 표시
# 진본확인 기능 시  진본확인 증명서 링크 걸기 
# 카드팀에서 접속 확인
* 서명완료 순으로 정렬 (기본)
* 본인이 다운로드 한 문서인지 표시


# 트리 구조 코드 리팩토링
* 신청서 양식 폼 등록 기능 
  - requester 를 user db 에 안넣고 하드코딩한 이유는 users 에 들어가면 화면단에 수정해야 할 것 이 더 많다 .... 차피 템플릿을 통한 등록만 되므로 hasRequester 값으로 보유여부만 체크하기로 결정
  - 작성자가 requester 이므로 별도로 user 추가시 더 꼬임 ...
  - TODO: 서명하기 (assign) requester는 안보이게 처리하되 prepare에서는 바로 입력컴포넌트로 변환하여 출력해준다.
  - TODO: requester 가 있는 경우 userTodo 와 usersOrder 재조정이 필요하다.
  - TODO: 템플릿 목록에서 일반 요청시 hasRequester :true 이면 바로 입력화면으로 보내자.

템플릿 저장시 컴포넌트 변경 작업해서 파일 별도로 저장해 두자.
템플릿 목록에서 신청시 해당 폼을 이용해 바로 sign 화면 노출.
sign 화면에서 requester 는 나로 한다.
document에 db에 문서 생성 프로세스를 모두 담는다.

신청서용 sign 을 별도로 생성한다.
* 체크박스 컴포넌트 추가 
  - TODO: 템플릿 prepare 에도 적용하기
  - TODO: 컴포넌트 스타일시트 조정

* 서명요청자 -> 네이밍을 바꾸자! 아래 의미를 중의적으로 사용 가능한 키워드로 변경 하자.
  - 일반요청인 경우 서명요청자는 본인으로 교체된다.
  - 대량요청인 경우 서명요청자는 참여자로 교체된다.

서명 참여자를 미리 복수개 지정가능하도록 ...


# 비용 비교 및 산정
  - 온프레미스 방식 : 기존에 받았던 자료 활용
  - cloud 방식 
  - 비교 업체 : 모두싸인, 글로싸인, 포시에스, 1개 더

# 농협사료 문의 - 답변 완료
# 용산 접속 문제 - 답변 완료

# 신청서 프로세스 
  1. 신청값 입력 -> 템플릿 생성 시 입력 박스 상태로 저장 -> 파일 저장 (TEMP)
  2. 참여자 선택 -> 템플릿이 있는 경우 불러온다.
  3. 발송

# 입력값 자동 셋팅 
  1. 이름, 직급, 날짜(년도, 월, 일자), 회사명 
  2. 사용자 컴포넌트 flattern 이후에 다시 삽입? 

* 서명하기 상단에 고정 (페이지가 많은 경우...)
# fontsize 설정값 따라가게 변경
# 개인에게도 서명 요청자 기능 열기 
# 서명 참여자 입력란 합치기 - PrepareDocument, PrepareTemplate
# 회사 템플릿은 신청하기만 남긴다? 
* 텍스트 정렬 기능 
# 폰트사이즈 복원시 사이즈가 작아지는 문제 - console.log('TMTM', annot.FontSize)
# 문서 다건인 경우 페이지가 떴다가 안떳다가 함  


# 신청서 프로세스 개선 
- 첨부기능 추가 
- 프로세스 간소화
* 체크박스 스타일 동일하게 변경

P1210044 나훈
P1610006 차헌영



192.168.161.25

git clone https://github.com/gobitfly/etherchain-light --recursive


http://localhost:5000/api/bulk/addBulk
{
    "user"	   : "60dbfeb557e078050836b473",
    "docTitle" : "bulk document 2",
    "users"     : ["60dbfeb557e078050836b473", "60dc111457e078050836b47e"],
    "docs"      : ["60dea7c97339d905696a41d7", "60dea8f67339d905696a41d9"],
    "canceled"  : false,
    "signed"    : false
}

192.168.161.25


# docker 
* 수동파일 배포
 > docker save -o nhsign_server.tar nhsign_server (배포)
 > docker load -i 경로 및 파일 (로드)
* docker hub 배포
 > docker login (dockerhub login)
 > docker tag nhsign_server:latest niceharu/nhsign:1.0 (이름 맞추기)
 > docker push niceharu/nhsign:1.0 (업로드)
 > sudo usermod -a -G docker $USER (다운로드 전에 계정에 docker 권한주기)
 > docker login (niceharu / password)
 > docker pull niceharu/nhsign:1.0 (다운로드)


# 월별 페이지수
db.documents.aggregate({ $match: {
    $and: [
        { "requestedTime": {$gte: new Date('2022-03-01'), $lte: new Date('2022-03-31')} },
        { signed: true }
    ]
} },
{ $group: { _id : null, sum : { $sum: "$pageCount" } } });

# 월별 건수
db.documents.find( {$and: [
        { "requestedTime": {$gte: new Date('2022-03-01'), $lte: new Date('2022-03-31')} },
        { signed: true }
]}).count()



# 버전 업데이트 후 오류 
- 기본 텍스트 박스 입력 시 textarea scroll 생김
- 기본 텍스트 박스 입력 시 한글 깨짐 (Mac 만 그럴수 있음)
# 자동 입력 정보 안보임  (버전 바뀌면서 qd -> name 으로 필드명 변경)
- 텍스트 박스 입력화면 merge가 안됨
- 서명 입력 후 유효성 체크가 동작 안함 && annot.Xa === null 이것때문인 것 같은데 ...

# 기능 개선
- 문서 상세보기 후 이전 화면 이동시 페이지 유지

# 내 문서함이 아닌 대시보드에서 메뉴 이동시 폴더 목록이 안뜨는 문제 -> includeBulk 가 있는 경우 return 되어서 앞으로 로직 이동
# 대시보드에서 문서 바로 클릭시 좌측 메뉴에 내 문서함 선택이 안됨 -> useEffect에 dispatch(setPathname('/documentList')); 
# 내 문서함에서 폴더 이동시 좌측 메뉴에 폴더 관리 선택이 안됨 -> useEffect에 dispatch(setPathname('/myFolder')); 
 
192.168.161.25


# 대량 전송 기능 개선
- 휴직자 처리
- 대량 전송 : 진행 상태만 엑셀 출력
- 요청 취소 문서 이력 관리 : 현행 삭제
- 대량 전송 일괄 파일 다운로드
- 대량 전송 상세보기 - 문서보기 후 페이지 처리 유지 


# 로그인 화면 모바일 최적화하기 
# 기존 템플릿 사용 중지 표시 
  # 템플릿 파일은 유지하되 참여자 설정만 변경하도록 유도한다.
  # 파일만 있는 경우 참여자설정시 무조건 withPDF로 가도록 설정한다.
  # 참여자 재설정시 무조건 withPDF로 가도록 설정한다.
  # 참여자 설정시 STEP 이 이상함 (Forms 참조 필요)
# thumbnail 해상도 올리기 0.3 -> 0.6
# 서명 입력이 안되는 문제 -> NHForms에 yarn.lock 을 가져와서 컴파일 함 


# 2.0.6
# 서명 취소 오류 해결 (API 가 바뀐듯)
# 서명 박스 최소 사이즈 줄이기 
# 인쇄 기능 DRM 문제 해결
# upload 시 개인 템플릿 선택시 오류

* 퇴사 시 문서처리를 위한 방안 개발 :  관리자에서 특정 사용자 문서 타사용자에게 공유하기? 

# 2.0.7
# 첨부파일 redux -> state 방식으로 변경

# 2.0.8
# 서명 컴포넌트 가독성 향상
# 진본 확인 WithPDF 로 변환
* Mac 에서 한글 올리면 깨지는 문제 ... Forms 는 괜찮음 (버전 동일함. 차이점은 server에 yarn.lock 이 다름 )
# 폴더 관리에 기본 최근 순서로 정렬

# 2.0.9
# 사용자 전체 선택 문제 해결 
# 취소 문구 변경 => 취소(반려)
# 양식함에 일반 컴포넌트의 경우 문서 요청시 사라짐

# 2.1.0
- [x] 본인의 서명만 완료된 경우 요청 취소 기능 추가 -> 요청 취소시 서명 취소 상태로 변경 (sever/client 동시 배포 필요)
- [x] 서명 취소 시 서명 요청자에게  푸시 알림 발송
- [x] withPDF 업데이트
- [x] 서명 참여자 검색 시 자동스크롤 기능 추가 
- [x] 메뉴얼 withPDF로 변경
- [x] 문서 뷰어 시 이중 스크롤바 안생기도록 푸터바 숨김처리  
- [x] 첨부파일에 # 포함 시 다운로드 안되는 문제 해결 (github pull 후 테스트 필요)
- [x] pdftron 지우기

# 2.1.1
- [ ] 사용자 등록 후 좌측에 사람을 빼고 우측 이동 시 맨오른쪽에 사람이 빠지지 않는다.
- [x] 템플릿 UI 고도화 및 템플릿 제목 수정 가능하도록 처리
- [x] jwtToken 적용
- [x] 템플릿 다운로드 시 DRM 적용
- [x] pdf 다건 일괄 다운로드 기능 - 내 문서, 폴더 적용
- [x] 메인 화면 서비스 호출 횟수 최적화
- [x] 프린터 스캔 문서 지원 (orientation 속성 걸린 문서)


# 로그인 JWT 토큰 방식으로 변경 
 1. [서버] jwt 토큰 생성/갱신/검증 모듈 생성 : adminAuth.js 참조
 2. [서버] 토큰 갱신 서비스 생성 : users /refresh 
 3. [서버] 로그인 서비스 적용 : users /login
          - accessToken, refreshToken 신규 생성
          - accessToken 쿠키 저장
          - refreshToken 응답 값 추가
 4. [서버] logout 서비스 적용 : users /logout 
 5. [서버] auth 서비스 적용 : users /auth 
 5. [서버] sso 서비스 적용 : users /sso
          sso 접속 테스트 : http://localhost:3000/?t=ykClWOR%2BXXPW8Gt9mJixzQ%3D%3D%26%26z0vgHkiQJxI7Y%2BjPTvWIgnMo3Hrw9DSXApgjvRbEo6btuL%2F8I6Kt63LiCRL%2Fylvg%26%26EZgpuOveH5LV4fspdJdNMQ%3D%3D
 6. [서버] 서비스 통신 시 토큰 검증 전처리 : ValidateToken
 7.  [클라이언트] login 시 토큰 추가 로직 추가 : Login.js
 8.  [클라이언트] logout 시 토큰 삭제 로직 추가 : Profile.js, view.js (Header.js 참조)
 9.  [클라이언트] auth 인증 시 토큰 로직 추가 (토큰 갱신, 토큰 localstorage 저장, 통합 로그인 처리) : App.js 
 10. [클라이언트] axiosInterceptor 추가 (토큰 유효성 검증 결과 선처리, 만약 검증 실패 응답 시 토큰 갱신 서비스 호출)
 11. [클라이언트] 토큰 검증이 필요한 모든 axios 서비스를 axiosInterceptor로 변경 (login, logout, auth 같은 인증 서비스들은 제외)



# PDFTRON 삭제
[x] Audit 
[x] Manual 
[x] MergeAnnotations
[x] PrepareDocument
[x] PrepareTemplate
[x] MergeDirect
[x] SignDirect
[x] SignDocument
[x] PreviewPDF
[x] UploadTemplate
[x] ViewDocument
[x] Config
