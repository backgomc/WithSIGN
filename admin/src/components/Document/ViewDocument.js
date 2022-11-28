import React, { useRef, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
// import { useSelector } from 'react-redux';
import { useIntl } from "react-intl";
// import { navigate } from '@reach/router';
import { Button, List } from 'antd';
import { PageContainer } from '@ant-design/pro-layout';
import { DownloadOutlined, ArrowLeftOutlined, PaperClipOutlined } from '@ant-design/icons';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
// import { selectUser, selectHistory } from '../../app/infoSlice';
import PDFViewer from '@niceharu/withpdf';
// import { LICENSE_KEY } from '../../config/Config';
// import WebViewer from '@pdftron/webviewer';
// import './ViewDocument.css';

const ViewDocument = ({location}) => {

  const [loadingDownload, setLoadingDownload] = useState([]);

  // const user = useSelector(selectUser);
  // const history = useSelector(selectHistory);

  const { docRef, docTitle, _id, attachFiles, items } = location.state.docInfo;
  const { formatMessage } = useIntl();
  const pdfRef = useRef();
  // const viewer = useRef(null);

  const listAttachFiles = (
    <List
      size="small"
      split={false}
      dataSource={attachFiles}
      itemLayout="horizontal"
      renderItem={item => <List.Item.Meta avatar={<PaperClipOutlined />} description={<a href={item.path} download={item.originalname} style={{color:'gray'}}>{item.originalname}</a> }/>}
    />
  )

  const initWithPDF = async () => {
    await pdfRef.current.uploadPDF(docRef, docTitle);
    const convItems = pdfRef.current.convertBoxToComponent(items);
    let drawItems = convItems.map(item => {
      item.disable = true;
      return item;
    });
    await pdfRef.current.importItems(drawItems);
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
          title: "문서 조회",
          ghost: true,
          breadcrumb: {
            routes: [
            ],
          },
          extra: [
            <Button key={uuidv4()} icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}></Button>,
            <Button key={uuidv4()} loading={loadingDownload['1']} href={'/admin/document/down/documents/'+_id} download={docTitle+'.pdf'} type="primary" icon={<DownloadOutlined />} onClick={()=> {
              setLoadingDownload( { "1" : true } )
              setTimeout(() => {
                setLoadingDownload( { "1" : false})
              }, 3000);
            }}>
              {formatMessage({id: 'document.download'})}
            </Button>
          ],
        }}
        content= {attachFiles?.length > 0 && listAttachFiles}
        footer={[
        ]}
      >
        <div><PDFViewer ref={pdfRef} isUpload={false} isSave={false} isEditing={false} defaultScale={1.0} headerSpace={attachFiles?.length > 0 ? 128 + attachFiles?.length * 30 : 128}/></div>
      </PageContainer> 
    </div>
  );
};

export default ViewDocument;
