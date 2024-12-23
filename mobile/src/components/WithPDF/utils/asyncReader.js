import { getAsset } from './prepareAssets';
// 1
// import pdfjsLib from 'pdfjs-dist/webpack';

// 2
// import * as pdfjsLib from "pdfjs-dist";
// import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";
// pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export function readAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function readAsImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    if (src instanceof Blob) {
      const url = window.URL.createObjectURL(src);
      img.src = url;
    } else {
      img.src = src;
    }
  });
}

export function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function readAsPDF(file) {
  const pdfjsLib = await getAsset('pdfjsLib');
  // Safari possibly get webkitblobresource error 1 when using origin file blob
  const blob = new Blob([file]);
  const url = window.URL.createObjectURL(blob);
  return pdfjsLib.getDocument(url).promise;
}

export async function readAsPDF_URL(url) {
  const pdfjsLib = await getAsset('pdfjsLib');
  return pdfjsLib.getDocument(url).promise;
}

export async function compressImage(file, quality = 0.5, maxWidth = 700, maxHeight = 700) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 이미지의 크기를 조절합니다.
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // 압축된 이미지를 base64로 변환합니다.
        canvas.toBlob(
          (blob) => {
            const compressedReader = new FileReader();
            compressedReader.onload = () => resolve(compressedReader.result);
            compressedReader.onerror = reject;
            compressedReader.readAsDataURL(blob);
          },
          file.type,
          quality
        );
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}