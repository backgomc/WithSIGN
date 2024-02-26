  # curl \
  #   --request POST 'http://localhost:3018/forms/chromium/convert/html' \
  #   --form 'files=@"./index.html"' \
  #   --form 'marginTop="0"' \
  #   --form 'marginBottom="0"' \
  #   --form 'marginLeft="0"' \
  #   --form 'marginRight="0"' \
  #   --form 'scale="1.0"' \
  #   -o result.pdf


curl \
  --request POST http://localhost:3018/forms/libreoffice/convert \
    --form 'files=@"./test.xlsx"' \
    -o result.pdf