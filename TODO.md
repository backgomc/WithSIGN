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

* docker 컴파일 시 server에 storage 날리기

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

# 배포
* client
 > yarn build
* docker 배포

//user
		String  sourceInfo     = Strings.emptyToNull((String)parameter.get("sourceInfo"));
		String  sourcePassword = Strings.emptyToNull((String)parameter.get("sourcePassword"));
		String  userId         = Strings.emptyToNull((String)parameter.get("userId"));
		String  name           = Strings.emptyToNull((String)parameter.get("name"));
		String  jobTitle       = Strings.emptyToNull((String)parameter.get("jobTitle"));
		String  jobGrade       = Strings.emptyToNull((String)parameter.get("jobGrade"));
		String  mobilePhoneNo  = Strings.emptyToNull((String)parameter.get("mobilePhoneNo"));
		String  officePhoneNo  = Strings.emptyToNull((String)parameter.get("officePhoneNo"));
		String  companyName    = Strings.emptyToNull((String)parameter.get("companyName"));
		String  companyCode    = Strings.emptyToNull((String)parameter.get("companyCode"));
		String  departCode     = Strings.emptyToNull((String)parameter.get("departCode"));
		String  companyDsc     = Strings.emptyToNull((String)parameter.get("companyDsc"));
		String  vacationType   = Strings.emptyToNull((String)parameter.get("vacationType"));
		boolean inUse          = (Boolean)parameter.get("inUse");

//org
		String  sourceInfo      = Strings.emptyToNull((String)parameter.get("sourceInfo"));
		String  sourcePassword  = Strings.emptyToNull((String)parameter.get("sourcePassword"));
		String  companyDsc      = Strings.emptyToNull((String)parameter.get("companyDsc"));
		String  companyName     = Strings.emptyToNull((String)parameter.get("companyName"));
		String  officeCode      = Strings.emptyToNull((String)parameter.get("officeCode"));
		String  officeName      = Strings.emptyToNull((String)parameter.get("officeName"));
		String  departCode      = Strings.emptyToNull((String)parameter.get("departCode"));
		String  departName      = Strings.emptyToNull((String)parameter.get("departName"));
		int     displayOrder    = (Integer)parameter.get("displayOrder");
		String  parentNodeId    = Strings.emptyToNull((String)parameter.get("parentNodeId"));
		boolean inUse           = (Boolean)parameter.get("inUse");

