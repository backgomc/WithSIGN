import React, { useRef, useEffect, useState } from 'react';
// import { useSelector } from 'react-redux';
import { useIntl } from "react-intl";
// import { navigate } from '@reach/router';
import { Row, Col, Button } from 'antd';
import { PageContainer } from '@ant-design/pro-layout';
import { DownloadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
// import { selectUser, selectHistory } from '../../app/infoSlice';
import { LICENSE_KEY } from '../../config/Config';
import WebViewer from '@pdftron/webviewer';
import './ViewDocument.css';

const ViewDocument = ({location}) => {

  const [loadingDownload, setLoadingDownload] = useState([]);

  // const user = useSelector(selectUser);
  // const history = useSelector(selectHistory);

  const { docRef, docTitle, _id } = location.state.docInfo;
  const { formatMessage } = useIntl();

  const viewer = useRef(null);

  useEffect(() => {
    WebViewer({
      path: 'webviewer',
      licenseKey: LICENSE_KEY,
      disabledElements: [
        'ribbons',
        'toggleNotesButton',
        'viewControlsButton',
        'panToolButton',
        'selectToolButton', 
        'searchButton',
        'menuButton',
        'commentsButton',
        'contextMenuPopup'
      ]
    },
    viewer.current
    ).then(async instance => {
      const { annotManager, CoreControls } = instance;

      instance.setToolbarGroup('toolbarGroup-View');
      CoreControls.setCustomFontURL('/webfonts/');
      annotManager.setReadOnly(true);

      const URL = '/' + docRef;
      console.log('URL:'+URL);
      instance.docViewer.loadDocument(URL);
    });
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
            <Button key="2" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}></Button>,
            <Button key="3" loading={loadingDownload['1']} href={'/admin/document/down/documents/'+_id} download={docTitle+'.pdf'} type="primary" icon={<DownloadOutlined />} onClick={()=> {
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
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <div className='webviewer' ref={viewer}></div>
          </Col>
        </Row>
      </PageContainer> 
    </div>
  );
};

export default ViewDocument;
