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

const PreviewPDF = ({location}) => {

  const { formatMessage } = useIntl();

  const docRef = location.state.docRef
  const docTitle = location.state.docTitle

  const [instance, setInstance] = useState(null)
  const [loading, setLoading] = useState(false);

  const user = useSelector(selectUser);
  const { _id } = user;
  const viewer = useRef(null);

  useEffect(() => {

    // FILE Thumbnail 추출 
    WebViewer(
      {
        path: 'webviewer',
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
      setInstance(instance)

      const { docViewer } = instance;

      // DISTO
      const URL = '/' + docRef;      
      instance.docViewer.loadDocument(URL);
      
      docViewer.on('documentLoaded', () => {
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
          <Button key="1" onClick={() => window.history.back()}>
            {formatMessage({id: 'Back'})}
          </Button>,
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
