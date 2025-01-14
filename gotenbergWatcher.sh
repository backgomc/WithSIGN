#!/bin/bash
##############################################################################
# 2025.01.14 CSI
# server > routes > admin.js
# '/restartGotenberg'  //Gotenberg 재실행
# 위 서비스에서 생성된 GotenRestart.txt 파일을 10초 간격으로 파일을 읽고
# 내용이 'Y'일때 gotenberg이미지를 재기동하고 파일 내용을 'N'으로 변경
# 내용이 'N'이면 대기
##############################################################################

# 감시할 파일
FILE="/home/skysojiro/project/nhsign/Data/storage/GotenRestart.txt"
# 도커컴포즈 YML 설정파일
YML="/home/skysojiro/project/nhsign/nhsign/docker-compose-sign.yml"
# 감시간격 10초단위
TERM="10"

# 파일이 존재하지 않으면 생성
if [ ! -f "$FILE" ]; then
  echo "N" > "$FILE"
  echo "$FILE 파일이 생성되었습니다"
fi

echo "파일 감시를 시작합니다"

# 실시간 감시 루프
while true; do
  if [ -f "$FILE" ]; then
    CONTENT=$(cat "$FILE")
    if [ "$CONTENT" = "Y" ]; then
      echo "재수행 시작"
      docker-compose -f "$YML" up -d --no-deps --force-recreate gotenberg
      echo "N" > "$FILE"
      echo "재수행 완료"
    elif [ "$CONTENT" = "N" ]; then
      echo "대기..."
    fi
  fi
  sleep "$TERM"
done