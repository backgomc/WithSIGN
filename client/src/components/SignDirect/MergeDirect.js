import axios from 'axios';
import { LICENSE_KEY } from '../../config/Config';

export const mergeDirect = async (docRef, xfdf) => {

  let tempPath = '';
  const PDFNet = window.PDFNet;

  const CoreControls = window.CoreControls;
  CoreControls.setWorkerPath('webviewer/core');
  CoreControls.setCustomFontURL("/webfonts/");
  
  const URL = '/' + docRef;
  
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
  
    const docbuf = await doc.saveMemoryBuffer(
      PDFNet.SDFDoc.SaveOptions.e_linearized,
    );
    const blob = new Blob([docbuf], {
      type: 'application/pdf',
    });
  
    // 파일 임시 저장
    const filename = `direct_${Date.now()}.pdf`
    const formData = new FormData()
    formData.append('path', 'tempDirect/')
    formData.append('file', blob, filename)
    
    const res = await axios.post(`/api/storage/upload`, formData)
    console.log(res)

    if (res.data.success) {
      tempPath = res.data.file.path;
    }
  }

  await PDFNet.runWithCleanup(main, LICENSE_KEY);
  return tempPath;

};
