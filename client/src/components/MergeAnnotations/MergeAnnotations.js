// import { storage } from '../../firebase/firebase';
import axios from 'axios';

export const mergeAnnotations = async (docRef, xfdf) => {
  const PDFNet = window.PDFNet;
  const CoreControls = window.CoreControls;
  CoreControls.setWorkerPath('webviewer/core');

  // const storageRef = storage.ref();
  // const URL = await storageRef.child(docRef).getDownloadURL();
  const URL = "/storage/" + docRef;
  
  const main = async () => {
    const doc = await PDFNet.PDFDoc.createFromURL(URL);
    doc.initSecurityHandler();

    let i;
    for (i=0; i < xfdf.length; i++) {
        console.log(xfdf[i]);
        let fdfDoc = await PDFNet.FDFDoc.createFromXFDF(xfdf[i]);
        await doc.fdfMerge(fdfDoc);
        await doc.flattenAnnotations();
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
    formData.append('file', blob, docRef)
    const res = await axios.post(`/api/storage/upload`, formData)
    console.log(res)
  
  }

  await PDFNet.runWithCleanup(main);
};
