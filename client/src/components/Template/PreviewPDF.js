import React, { useRef, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { navigate } from '@reach/router';
import { selectUser } from '../../app/infoSlice';
import 'antd/dist/antd.css';
import { Button } from 'antd';
import { useIntl } from "react-intl";
import { PageContainer } from '@ant-design/pro-layout';
import WebViewer from '@pdftron/webviewer';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import { LICENSE_KEY } from '../../config/Config';
import {
  ArrowLeftOutlined,
  DownloadOutlined
} from '@ant-design/icons';

const PreviewPDF = ({location}) => {

  const { formatMessage } = useIntl();

  const docRef = location.state.docRef
  const docTitle = location.state.docTitle

  const [instance, setInstance] = useState(null)
  const [loading, setLoading] = useState(false);
  const [loadingDownload, setLoadingDownload] = useState([]);

  const user = useSelector(selectUser);
  const { _id } = user;
  const viewer = useRef(null);

  useEffect(() => {

    // FILE Thumbnail 추출 
    WebViewer(
      {
        path: 'webviewer',
        licenseKey: LICENSE_KEY,
        disabledElements: [
          'ribbons',
          'toggleNotesButton',
          'searchButton',
          'menuButton',
          'contextMenuPopup',
        ],
      },
      viewer.current,
    )
    .then(instance => {

      // const { docViewer, CoreControls } = instance;
      const { Core, UI } = instance;
      const { documentViewer } = Core;

      // set local font 
      Core.setCustomFontURL("/webfonts/");

      // set language
      UI.setLanguage('ko');

      setInstance(instance)

      // set file url
      const URL = '/' + docRef;      
      UI.loadDocument(URL);
      
      documentViewer.addEventListener('documentLoaded', () => {
        console.log('documentLoaded called');
      });
    });

  }, []);


  return (
    <div
    style={{
    }}
    >
      <PageContainer
      loading={loading}
      ghost
      header={{
        title: docTitle,
        ghost: false,
        breadcrumb: {
          routes: [
          ],
        },
        extra: [
          <Button key="1" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
            {/* {formatMessage({id: 'Back'})} */}
          </Button>,
          <Button key="3" loading={loadingDownload['1']} href={docRef} download={docTitle+'.pdf'} type="primary" icon={<DownloadOutlined />} onClick={()=> {
            setLoadingDownload( { "1" : true } )
            setTimeout(() => {
              setLoadingDownload( { "1" : false})
            }, 3000);
          }}>
            {formatMessage({id: 'document.download'})}
          </Button>
        ],
      }}
      footer={[
      ]}
    >
      <br></br>

      <div className="webviewer" ref={viewer} style={{}}></div>  
    </PageContainer>
    
  </div>
  )

};

export default PreviewPDF;
