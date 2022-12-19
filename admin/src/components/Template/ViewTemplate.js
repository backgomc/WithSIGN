import React, { useRef, useEffect, useState } from 'react';
// import axiosInterceptor from '../../config/AxiosConfig';
import { v4 as uuidv4 } from 'uuid';
// import { useSelector } from 'react-redux';
import { useIntl } from "react-intl";
// import { navigate } from '@reach/router';
import { Button } from 'antd';
import { PageContainer } from '@ant-design/pro-layout';
import { DownloadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
// import { selectUser, selectHistory } from '../../app/infoSlice';
import PDFViewer from '@niceharu/withpdf';
// import { LICENSE_KEY } from '../../config/Config';
// import WebViewer from '@pdftron/webviewer';

const ViewTemplate = ({location}) => {

  const [loadingDownload, setLoadingDownload] = useState([]);

  // const user = useSelector(selectUser);
  // const history = useSelector(selectHistory);

  const { docRef, docTitle, _id, items } = location.state.docInfo;
  const { formatMessage } = useIntl();
  const pdfRef = useRef();
  // const viewer = useRef(null);

  const initWithPDF = async () => {
    await pdfRef.current.uploadPDF(docRef);
    // const convItems = pdfRef.current.convertBoxToComponent(items);
    // let drawItems = convItems.map(item => {
    //   item.disable = true;
    //   return item;
    // });
    await pdfRef.current.importItems(items);
  }

  useEffect(() => {
    initWithPDF();
    // WebViewer({
    //   path: 'webviewer',
    //   licenseKey: LICENSE_KEY,
    //   disabledElements: [
    //     'ribbons',
    //     'toggleNotesButton',
    //     // 'viewControlsButton',
    //     // 'panToolButton',
    //     // 'selectToolButton', 
    //     'searchButton',
    //     // 'menuButton',
    //     'commentsButton',
    //     'contextMenuPopup'
    //   ]
    // },
    // viewer.current
    // ).then(async instance => {
    //   const { Core, UI } = instance;
    //   const { annotationManager, Annotations } = Core;

    //   UI.setToolbarGroup('toolbarGroup-View');
    //   Core.setCustomFontURL('/webfonts/');
    //   annotationManager.setReadOnly(true);

    //   annotationManager.addEventListener('annotationChanged', (annotations, action, { imported }) => {
    //     if (imported) {
    //       annotations.forEach(function(annot) {
    //         annot.NoMove = true;
    //         annot.NoDelete = true;
    //         annot.ReadOnly = true;
    //         if (annot instanceof Annotations.WidgetAnnotation) {
    //           annot.fieldFlags.set('ReadOnly', true);
    //           if (annot.fieldName.includes('SIGN')) { // SIGN annotation 숨김처리
    //             annot.Hidden = true;
    //           }
    //         }
    //       });
    //     }
    //   });

    //   const URL = '/' + docRef;
    //   console.log('URL:'+URL);
    //   UI.loadDocument(URL, { filename: docTitle+'.pdf' });
    // });
    return () => {
      setLoadingDownload([]);
    } // cleanup
  }, [docRef]);

  return (
    <div>
      <PageContainer      
        // ghost
        header={{
          title: "템플릿 상세",
          ghost: true,
          breadcrumb: {
            routes: [
            ],
          },
          extra: [
            <Button key={uuidv4()} icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}></Button>,
            <Button key={uuidv4()} loading={loadingDownload['1']} href={'/admin/document/down/templates/'+_id} download={docTitle+'.pdf'} type="primary" icon={<DownloadOutlined />} onClick={()=> {
              setLoadingDownload( { "1" : true } )
              setTimeout(() => {
                setLoadingDownload( { "1" : false})
              }, 3000);
            }}>
              {formatMessage({id: 'document.download'})}
            </Button>
          ],
        }}
        // content= {}
        footer={[
        ]}
      >
        <div><PDFViewer ref={pdfRef} isUpload={false} isSave={false} isEditing={false} defaultScale={1.0}/></div>
      </PageContainer> 
    </div>
  );
};

export default ViewTemplate;
