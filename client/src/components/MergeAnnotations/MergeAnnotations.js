import axios from 'axios';
import { LICENSE_KEY } from '../../config/Config';

export const mergeAnnotations = async (docId, docRef, xfdf, isLast) => {

  const PDFNet = window.PDFNet;

  const CoreControls = window.CoreControls;
  CoreControls.setWorkerPath('webviewer/core');

  // const storageRef = storage.ref();
  // const URL = await storageRef.child(docRef).getDownloadURL();

  // DISTO
  const URL = '/' + docRef;
  
  const main = async () => {
    const doc = await PDFNet.PDFDoc.createFromURL(URL);
    doc.initSecurityHandler();

    let i;
    for (i=0; i < xfdf.length; i++) {
        console.log("A merge xfdf:" + xfdf[i]);
        let fdfDoc = await PDFNet.FDFDoc.createFromXFDF(xfdf[i]);
        await doc.fdfMerge(fdfDoc);
        // await doc.flattenAnnotations();  //TODO: 이거는 문서 최종 반영시 실행
    }

    if (isLast) {
      console.log("isLast:"+isLast)
       await doc.flattenAnnotations();  // 문서 최종 반영시 실행
    }
  
    const docbuf = await doc.saveMemoryBuffer(
      PDFNet.SDFDoc.SaveOptions.e_linearized,
    );
    const blob = new Blob([docbuf], {
      type: 'application/pdf',
    });
  
    // const documentRef = storageRef.child(docRef);
  
    // documentRef.put(blob).then(function (snapshot) {
    //   console.log('Uploaded the blob');
    // });

    // FILE OVERWRITE
    const formData = new FormData()

    var reg = new RegExp('(.*\/).*')
    console.log('path:'+reg.exec(docRef)) //docToSign/614bca38d55fa404d35dad1d/
    formData.append('path', reg.exec(docRef)[1]) //docRef 에서 경로만 추출
    formData.append('isLast', isLast)
    formData.append('docId', docId)

    formData.append('file', blob, docRef)
    
    const res = await axios.post(`/api/storage/upload`, formData)
    console.log(res)

    // SAVE FILE HASH (마지막 서명인 경우)
    if (isLast) {
      let param = {
        docId: docId
      }
      const res = await axios.post(`/api/storage/updateHash`, param)
      console.log(res)
    }
  
  }

  await PDFNet.runWithCleanup(main, LICENSE_KEY);
};
