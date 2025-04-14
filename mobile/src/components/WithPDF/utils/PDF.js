import { readAsArrayBuffer } from './asyncReader.js';
import { getAsset } from './prepareAssets';
import { noop } from './helper.js';
import 
{ PDFDocument, 
  StandardFonts,
  pushGraphicsState, 
  setLineCap,
  popGraphicsState,
  setLineJoin,
  LineCapStyle,
  LineJoinStyle,
  degrees, 
  rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
// import fontUrl from '../assets/font/NotoSansKR-Light.otf';
import { Fonts } from './Fonts';
import { TYPE_SIGN, TYPE_TEXT, TYPE_BOX, TYPE_IMAGE, TYPE_CHECKBOX, TYPE_DROPDOWN } from '../Common/Constants';
import download from 'downloadjs';

import icon_checked from '../assets/images/checked.png';
import icon_unchecked from '../assets/images/unchecked.png';
import { gray } from 'tailwindcss/colors.js';

// rotation 적용하여 좌표값 리턴 
const compensateRotation = (pageRotation, x, y, scale, dimensions, fontSize) => {
  let rotationRads = (pageRotation.angle * Math.PI) / 180;

  let coordsFromBottomLeft = {
    x: x / scale,
  };
  if (pageRotation.angle === 90 || pageRotation.angle === 270) {
    coordsFromBottomLeft.y = dimensions.width - (y + fontSize) / scale;
  } else {
    coordsFromBottomLeft.y = dimensions.height - (y + fontSize) / scale;
  }

  let drawX = null;
  let drawY = null;
  if (pageRotation.angle === 90) {
    drawX =
      coordsFromBottomLeft.x * Math.cos(rotationRads) -
      coordsFromBottomLeft.y * Math.sin(rotationRads) +
      dimensions.width;
    drawY =
      coordsFromBottomLeft.x * Math.sin(rotationRads) +
      coordsFromBottomLeft.y * Math.cos(rotationRads);
  } else if (pageRotation.angle === 180) {
    drawX =
      coordsFromBottomLeft.x * Math.cos(rotationRads) -
      coordsFromBottomLeft.y * Math.sin(rotationRads) +
      dimensions.width;
    drawY =
      coordsFromBottomLeft.x * Math.sin(rotationRads) +
      coordsFromBottomLeft.y * Math.cos(rotationRads) +
      dimensions.height;
  } else if (pageRotation.angle === 270) {
    drawX =
      coordsFromBottomLeft.x * Math.cos(rotationRads) -
      coordsFromBottomLeft.y * Math.sin(rotationRads);
    drawY =
      coordsFromBottomLeft.x * Math.sin(rotationRads) +
      coordsFromBottomLeft.y * Math.cos(rotationRads) +
      dimensions.height;
  } else {
    //no rotation
    drawX = coordsFromBottomLeft.x;
    drawY = coordsFromBottomLeft.y;
  }

  return { x: drawX, y: drawY };
};

export async function save(pdfFile, pdfUrl, objects, name, isDownload, waterMark) {
  // const PDFLib = await getAsset('PDFLib');
  // const download = await getAsset('download');
  // const makeTextPDF = await getAsset('makeTextPDF');
  
  let pdfDoc;
  try {
    if (pdfFile) {
      pdfDoc = await PDFDocument.load(await readAsArrayBuffer(pdfFile));
    } else if (pdfUrl) {
      console.log('여기까지 옴')
      // url to arraybuffer
      pdfDoc = await PDFDocument.load(await fetch(pdfUrl).then(r => r.arrayBuffer()));
    }
    
  } catch (e) {
    console.log('Failed to load PDF.');
    throw e;
  }

  // text가 없으면 customFont를 추가하여 용량을 증가시킬 필요가 없다.
  let font;
  if (objects.some(el => el.type === TYPE_TEXT || el.type === TYPE_DROPDOWN) ) {
    pdfDoc.registerFontkit(fontkit);
    const fontBytes = await fetch(Fonts['NotoSansKR'].src).then(res => res.arrayBuffer());
    font = await pdfDoc.embedFont(fontBytes);   
  } else {
    font = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  }
  
  // Watermark 를 텍스트로 사용하는 경우
  // let font, fontWaterMark;
  // if (objects.some(el => el.type === TYPE_TEXT) || waterMark) {
  //   pdfDoc.registerFontkit(fontkit);

  //   if (objects.some(el => el.type === TYPE_TEXT)) {
  //     const fontBytes = await fetch(Fonts['NotoSansKR'].src).then(res => res.arrayBuffer());
  //     font = await pdfDoc.embedFont(fontBytes);   
  //   }

  //   if (waterMark) {
  //     const fontBytes = await fetch(Fonts['NotoSansKR-Regular'].src).then(res => res.arrayBuffer());
  //     fontWaterMark = await pdfDoc.embedFont(fontBytes);
  //   }

  // } else {
  //   font = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  // }

  function createWatermarkImage(text, width=595, height=841) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
  
    context.font = '48px NotoSansKR';
    context.fillStyle = 'rgba(128, 128, 128, 0.2)'; // 회색 및 투명도 설정
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate((Math.PI / 180) * -45); // 45도 회전
    context.fillText(text, 0, 0);
  
    return canvas.toDataURL('image/png');
  }
  
  const pagesProcesses = pdfDoc.getPages().map(async (page, pageIndex) => {

    // S.워터마크 추가 ------------------------------------------- 
    if (waterMark) {
      console.log('draw waterMark');
      const { width, height } = page.getSize();

      // CASE 1: 여러개 배치
      // const textWidth = fontWaterMark.widthOfTextAtSize(waterMark, 18);
      // const textHeight = fontWaterMark.heightAtSize(18);
      // const margin = 180; // 각 워터마크 사이의 간격 (픽셀 단위)
      // const secureText = "해당 문서는 보안 문서입니다."; // 추가할 보안 문구
      // for (let x = 0; x < width; x += textWidth + margin) {
      //   for (let y = 0; y < height; y += textHeight + margin) {
      //     page.drawText((x / (textWidth + margin) + y / (textHeight + margin)) % 2 === 0 ? waterMark : secureText, {
      //       font: fontWaterMark,
      //       size: 18,
      //       x: x,
      //       y: y,
      //       color: rgb(0.5, 0.5, 0.5),  // 회색
      //       opacity: 0.2,               // 투명도 설정
      //       rotate: degrees(45),        // 45도 회전
      //     });
      //   }
      // }

      // CASE 2: 페이지 가운데 배치 
      // const textWidth = fontWaterMark.widthOfTextAtSize(waterMark, 48);
      // const textHeight = fontWaterMark.heightAtSize(48);

      // const centerX = (width - textWidth) / 2; 
      // const centerY = (height - textHeight) / 2;

      // page.drawText(waterMark, {
      //   font: fontWaterMark,
      //   size: 48,
      //   x: centerX + 60,
      //   y: centerY - 110,
      //   color: rgb(0.5, 0.5, 0.5),  // 회색
      //   opacity: 0.2,               // 투명도 설정
      //   rotate: degrees(45),        // 45도 회전
      // });

      // CASE 3: 페이지 가운데 배치 > 이미지로 저장
      // 텍스트를 이미지로 변환
      // Canvas를 사용하여 워터마크 이미지 생성
      const watermarkImageDataUrl = createWatermarkImage(waterMark, width, height);
      const pngImageBytes = Buffer.from(watermarkImageDataUrl.split(',')[1], 'base64');
      const watermarkImage = await pdfDoc.embedPng(pngImageBytes);

      const { width: imageWidth, height: imageHeight } = watermarkImage;

      const centerX = (width - imageWidth) / 2;
      const centerY = (height - imageHeight) / 2;
  
      page.drawImage(watermarkImage, {
        x: centerX,
        y: centerY,
        width: imageWidth,
        height: imageHeight
      });

    }
    // E. 워터마크 추가 ------------------------------------------- 

    // const pageObjects = objects[pageIndex];
    const pageObjects = objects.filter(el => el.pIdx === pageIndex);
    // 'y' starts from bottom in PDFLib, use this to calculate y
    const pageHeight = page.getHeight();
    const embedProcesses = pageObjects.map(async (object) => {

      //AS-IS : 파일 기반 저장 (TYPE_IMAGE)
      // if (object.type === TYPE_IMAGE) {  
      //   let { file, x, y, width, height, payload } = object;

      //   const correction = compensateRotation(
      //     page.getRotation(), 
      //     x, y, 
      //     1, page.getSize(), height
      //   );
        
      //   let img;
      //   try {

      //     if (file.type === 'image/jpeg') {
      //       img = await pdfDoc.embedJpg(await readAsArrayBuffer(file));
      //     } else {
      //       img = await pdfDoc.embedPng(await readAsArrayBuffer(file));
      //     }

      //     return () =>
      //       page.drawImage(img, {
      //         // x,
      //         // y: pageHeight - y - height,
      //         x: correction.x,
      //         y: correction.y,
      //         width,
      //         height,
      //         rotate: page.getRotation()
      //       });
      //   } catch (e) {
      //     console.log('Failed to embed image.', e);
      //     return noop;
      //   }
      // }

      //TO-BE: base64 기반 저장 (TYPE_IMAGE)
      if (object.type === TYPE_IMAGE) {

        let { x, y, width, height, payload } = object;
        // console.log('TYPE_IMAGE save', payload)
        
        const correction = compensateRotation(
          page.getRotation(), 
          x, y, 
          1, page.getSize(), height
        );

        // console.log('correction', correction)
            
        try {
          
          let img;
          if (payload.src.startsWith('data:image/jpeg;base64,')) {
            img = await pdfDoc.embedJpg(await (await fetch(payload.src)).arrayBuffer());
          } else if (payload.src.startsWith('data:image/png;base64,')) {
            img = await pdfDoc.embedPng(await (await fetch(payload.src)).arrayBuffer());
          } else {
            return noop;
          }

          return () =>
            page.drawImage(img, {
              // x,
              // y: pageHeight - y - height,
              // width,
              // height,
              x: correction.x,
              y: correction.y,
              width,
              height,
              rotate: page.getRotation()
            });
        } catch (e) {
          console.log('Failed to embed image.', e);
          return noop;
        }

      } else if (object.type === TYPE_SIGN) {

        let { x, y, width, height, payload } = object;

        console.log('TYPE_SIGN save', payload)
        
        // console.log('page.getRotation():', page.getRotation().angle)
        // console.log('x:', x)
        // console.log('y:', pageHeight - y - height)
        // console.log('pageWidth:', page.getWidth())
        // console.log('pageHeight:', pageHeight)
        // console.log('y:', y)
        // console.log('width:', width)
        // console.log('height:', height)

        const correction = compensateRotation(
          page.getRotation(), 
          x, y, 
          1, page.getSize(), height
        );

        console.log('correction', correction)
            
        try {
          let dataUrl = "data:application/octet-binary;base64," + payload.src.split(",")[1];
          let img = await pdfDoc.embedPng(await (await fetch(dataUrl)).arrayBuffer());;
          return () =>
            page.drawImage(img, {
              // x,
              // y: pageHeight - y - height,
              // width,
              // height,
              x: correction.x,
              y: correction.y,
              width,
              height,
              rotate: page.getRotation()
            });
        } catch (e) {
          console.log('Failed to embed image.', e);
          return noop;
        }

      } else if (object.type === TYPE_TEXT || object.type === TYPE_DROPDOWN) {
        let { x, y, lines, lineHeight, fontSize, fontFamily, width, textAlign } = object;

        // const correction = compensateRotation(
        //   page.getRotation(), 
        //   x, y, 
        //   1, page.getSize(), height
        // );

        // const height = size * lineHeight * lines.length;
        // const [textPage] = await pdfDoc.embedPdf(
        //   await makeTextPDF({
        //     lines,
        //     fontSize: size,
        //     lineHeight,
        //     width,
        //     height,
        //     font: font.buffer || fontFamily, // built-in font family
        //     dy: font.correction(size, lineHeight),
        //   }),
        // );

        // line 의 텍스트 길이가 div 너비보다 크면 줄바꿈 처리해준다.
        let newLines = []
        lines.forEach((line, idx) => {
          const words = line.split('');
          let currentLine = '';
          words.forEach(word => {
            const textLine = currentLine.length === 0 ? word : `${currentLine}${word}`;
            const textWidth =  measureText(textLine, fontSize).width;

            if (textWidth+1 <= width) {
              currentLine = textLine;
            } else {
              newLines.push(currentLine);
              currentLine = word;
            }

          })
          newLines.push(currentLine);
        })
        // console.log('newLines', newLines)

        return () =>
          newLines.forEach((line, idx) => {
            console.log('line', line);

            // 이슈 해결: 스페이스가 2칸 이상인 경우 너비가 달라지는 현상 해결
            // 스페이스가 두 칸 이상인 경우 \u00a0 공백이 생긴다.
            // console.log('1:', line.includes(' '));
            // console.log('2:', line.includes('\u00a0'));
            line = line.replace(/\u00a0/gi, " ");
            // console.log('3:', line.includes(' '));
            // console.log('4:', line.includes('\u00a0'));

            // text align
            let _x = x;
            if (textAlign === 'center') {
              _x = x + (width / 2 - measureText(line, fontSize).width / 2);
            } else if (textAlign === 'right') {
              _x = x + width - measureText(line, fontSize).width;
            }

            const correction = compensateRotation(
              page.getRotation(), 
              _x, y - 1, 
              1, page.getSize(), (fontSize * lineHeight * (idx + 1) - 3)
            );

            page.drawText(line, {
              font,
              size: fontSize,
              // x: _x,
              // y: pageHeight - y - (fontSize * lineHeight * (idx + 1)) + 3,
              x: correction.x,
              y: correction.y,
              rotate: page.getRotation()
            });

          })
          // page.drawPage(textPage, {
          //   width,
          //   height,
          //   x,
          //   y: pageHeight - y - height,
          // });
      } else if (object.type === TYPE_CHECKBOX) {

        let { x, y, width, height, checked } = object;

        // checkbox 크기 리사이징 및 위치 재조정
        x = x + width/2 - 12;
        y = y + 1;

        width = 24;
        height = 24;

        const correction = compensateRotation(
          page.getRotation(), 
          x, y, 
          1, page.getSize(), height
        );

        try {
          let img = await pdfDoc.embedPng(await (await fetch(checked ? icon_checked : icon_unchecked)).arrayBuffer());

          return () =>
            page.drawImage(img, {
              // x,
              // y: pageHeight - y - height,
              x: correction.x,
              y: correction.y,
              width,
              height,
              rotate: page.getRotation()
            });
        } catch (e) {
          console.log('Failed to embed image.', e);
          return noop;
        }

      } else if (object.type === 'drawing') {
        let { x, y, path, scale } = object;
        // const {
        //   pushGraphicsState,
        //   setLineCap,
        //   popGraphicsState,
        //   setLineJoin,
        //   LineCapStyle,
        //   LineJoinStyle,
        // } = PDFLib;
        return () => {
          page.pushOperators(
            pushGraphicsState(),
            setLineCap(LineCapStyle.Round),
            setLineJoin(LineJoinStyle.Round),
          );
          page.drawSvgPath(path, {
            borderWidth: 5,
            scale,
            x,
            y: pageHeight - y,
          });
          page.pushOperators(popGraphicsState());
        };
      }
    });
    // embed objects in order
    const drawProcesses = await Promise.all(embedProcesses);
    drawProcesses.forEach((p) => p());
  });
  await Promise.all(pagesProcesses);
  try {
    const pdfBytes = await pdfDoc.save();

    if (isDownload) {
      download(pdfBytes, name, 'application/pdf');
    }

    return pdfBytes;

  } catch (e) {
    console.log('Failed to save PDF.');
    throw e;
  }
}

function measureText(pText, pFontSize, pStyle) {
  var lDiv = document.createElement('div');

  document.body.appendChild(lDiv);

  if (pStyle != null) {
      lDiv.style = pStyle;
  }
  lDiv.style.fontSize = "" + pFontSize + "px";
  lDiv.style.position = "absolute";
  lDiv.style.left = -1000;
  lDiv.style.top = -1000;

  lDiv.textContent = pText;

  var lResult = {
      width: lDiv.clientWidth,
      height: lDiv.clientHeight
  };

  document.body.removeChild(lDiv);
  lDiv = null;

  return lResult;
}