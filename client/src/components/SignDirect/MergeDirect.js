import axios from 'axios';
import { LICENSE_KEY } from '../../config/Config';

export const mergeDirect = async (docRef, xfdf, xfdfIn, _id) => {

  let tempPath = '';
  const PDFNet = window.PDFNet;

  const CoreControls = window.CoreControls;
  CoreControls.setWorkerPath('webviewer/core');
  CoreControls.setCustomFontURL("/webfonts/");
  
  const URL = '/' + docRef;
  
  const getToday = () => {
    var date = new Date();
    var year = date.getFullYear();
    var month = ('0' + (1 + date.getMonth())).slice(-2);
    var day = ('0' + date.getDate()).slice(-2);

    return year + month + day;
  }

  const main = async () => {
    const doc = await PDFNet.PDFDoc.createFromURL(URL);
    doc.initSecurityHandler();

    let i;
    for (i=0; i < xfdf.length; i++) {
        console.log("A merge xfdf:" + xfdf[i]);
        let fdfDoc = await PDFNet.FDFDoc.createFromXFDF(xfdf[i]);
        await doc.fdfMerge(fdfDoc);
    }

    await doc.flattenAnnotations();


    // 입력 컴포넌트 복원 
    // TODO: requester1 관련 컴포넌트는 삭제 필요 
    let fdfDoc = await PDFNet.FDFDoc.createFromXFDF(xfdfIn);
    await doc.fdfUpdate(fdfDoc);

  

  
    const docbuf = await doc.saveMemoryBuffer(
      PDFNet.SDFDoc.SaveOptions.e_linearized,
    );
    const blob = new Blob([docbuf], {
      type: 'application/pdf',
    });
  
    // 파일 임시 저장
    // const filename = `direct_${Date.now()}.pdf`
    // const formData = new FormData()
    // formData.append('path', 'tempDirect/')
    // formData.append('file', blob, filename)
    
    // const res = await axios.post(`/api/storage/upload`, formData)
    // console.log(res)

    // if (res.data.success) {
    //   tempPath = res.data.file.path;
    // }

    // 파일 저장
    const filename = `${_id}${Date.now()}.pdf`
    const path = `documents/${getToday()}/`
    const formData = new FormData()
    formData.append('path', path)
    formData.append('file', blob, filename)
    const res = await axios.post(`/api/storage/upload`, formData)
    if (res.data.success){
      tempPath = res.data.file.path 
    }

  }

  await PDFNet.runWithCleanup(main, LICENSE_KEY);
  return tempPath;

};
