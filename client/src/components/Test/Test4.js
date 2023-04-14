import React, { useEffect, useState } from 'react';
import 'antd/dist/antd.css';
import archiver from 'archiver';
import JSZipUtils from 'jszip-utils';
// import JSZip from 'jszip';
// import { saveAs } from 'file-saver';

const Test4 = () => {

  const [isDownloading, setIsDownloading] = useState(false);
  const [docs, setDocs] = useState([ 
    {docTitle: 'ccc', docRef: '/storage/documents/20230406/6156a3c9c7f00c0d4ace47441680763803876.pdf'},
    {docTitle: 'aaa', docRef: '/storage/documents/20220616/6156a3c9c7f00c0d4ace47441655361000504.pdf'},
    {docTitle: 'bbb', docRef: '/storage/documents/20220616/6156a3c9c7f00c0d4ace47441655361565851.pdf'},
  ]);

  const [pdfUrls, setPdfUrls] = useState([
    '/storage/documents/20230406/6156a3c9c7f00c0d4ace47441680763803876.pdf',
    '/storage/documents/20220616/6156a3c9c7f00c0d4ace47441655361000504.pdf',
    '/storage/documents/20220616/6156a3c9c7f00c0d4ace47441655361565851.pdf'
  ]);

  useEffect(() => {
  }, []);

  async function downloadPdf(url) {
    // const response = await fetch(url);
    // const blob = await response.blob();
    // return blob;

    let binary = await JSZipUtils.getBinaryContent(url);
    return binary;
  }

  function createZip(blobArray) {
    return new Promise((resolve, reject) => {
      const archive = archiver('zip', { zlib: { level: 9 } });
      const chunks = [];
      archive.on('data', (chunk) => {
        chunks.push(chunk);
      });
      archive.on('end', () => {
        const result = new Blob(chunks, { type: 'application/zip' });
        resolve(result);
      });
      archive.on('error', (err) => {
        reject(err);
      });
      blobArray.forEach((blob, index) => {
        archive.append(blob, { name: `pdf${index + 1}.pdf` });
      });
      archive.finalize();
    });
  }

  async function handleDownload() {
    const blobArray = await Promise.all(pdfUrls.map((url) => downloadPdf(url)));
    const zipBlob = await createZip(blobArray);
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pdfs.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div>
      <button onClick={handleDownload} disabled={isDownloading}>
        {isDownloading ? 'Downloading...' : 'Download PDFs as ZIP'}
      </button>
    </div>
  );
};

export default Test4;