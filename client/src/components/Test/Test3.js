import React, { useEffect, useState } from 'react';
import 'antd/dist/antd.css';
import JSZipUtils from 'jszip-utils';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const Test3 = () => {

  // ISSUE
  // 1. 용량 큰 녀석이 앞에 있으면 그게 생략됨
  const [isDownloading, setIsDownloading] = useState(false);
  const [docs, setDocs] = useState([ 
    {docTitle: 'ccc', docRef: '/storage/documents/20230406/6156a3c9c7f00c0d4ace47441680763803876.pdf'},
    {docTitle: 'aaa', docRef: '/storage/documents/20220616/6156a3c9c7f00c0d4ace47441655361000504.pdf'},
    {docTitle: 'bbb', docRef: '/storage/documents/20220616/6156a3c9c7f00c0d4ace47441655361565851.pdf'},
  ]);

  useEffect(() => {
  }, []);

  const zip = new JSZip();
  const zipFilename = 'aaa.zip';
  const donwloadAll = async () => { 
    setIsDownloading(true); 
    try {

      docs.forEach( async (doc, index) => {
        var filename = doc.docTitle + '.pdf';
        
        setTimeout(3000)
        let data = await JSZipUtils.getBinaryContent(doc.docRef);

        zip.file(filename, data, { binary: true });
        if (index === docs.length - 1) {
          var zipFile = await zip.generateAsync({ type: 'blob' });
          saveAs(zipFile, zipFilename);
        }

        // loading a file and add it in a zip file
        // JSZipUtils.getBinaryContent(doc.docRef, async (err, data) => {
        //   if (err) {
        //     throw err; // or handle the error
        //   }
        //   zip.file(filename, data, { binary: true });
        //   if (index === docs.length - 1) {
        //     var zipFile = await zip.generateAsync({ type: 'blob' });
        //     saveAs(zipFile, zipFilename);
        //   }
        // });
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div>
      <button onClick={donwloadAll} disabled={isDownloading}>
        {isDownloading ? 'Downloading...' : 'Download PDFs as ZIP'}
      </button>
    </div>
  );
};

export default Test3;