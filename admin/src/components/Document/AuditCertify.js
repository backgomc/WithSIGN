import React, { useRef, useEffect } from 'react';
import { useIntl } from "react-intl";
import { navigate } from '@reach/router';
import { v4 as uuidv4 } from 'uuid';
import { Row, Col, Button } from 'antd';
import { PageContainer } from '@ant-design/pro-layout';
import { DownloadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import { LICENSE_KEY } from '../../config/Config';
import WebViewer from '@pdftron/webviewer';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import AuditDocument from './AuditDocument';

const asPdf = pdf([]);

const AuditCertify = ({location}) => {
  
  const { docTitle } = location.state.docInfo;
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
      const { Core, UI } = instance;
      const { annotationManager } = Core;

      UI.setToolbarGroup('toolbarGroup-View');
      Core.setCustomFontURL('/webfonts/');
      annotationManager.setReadOnly(true);

      let auditDocument = <AuditDocument item={location.state.docInfo} />;
      asPdf.updateContainer(auditDocument);
      UI.loadDocument(await asPdf.toBlob(), { filename: docTitle+'_진본확인.pdf' });
    });
    return () => {}; // cleanup
  }, []);

  return (
    <div>
      <PageContainer
        header={{
          title: '진본 확인 증명서',
          extra: [
            <Button key={uuidv4()} icon={<ArrowLeftOutlined />} onClick={() => navigate('/documentList')}></Button>,
            // <PDFDownloadLink document={<MyDocument />} fileName={docTitle+'_진본확인.pdf'}>
            //   {
            //     ({ blob, url, loading, error }) => <Button key={uuidv4()} loading={loading} type="primary" icon={<DownloadOutlined />}>{formatMessage({id: 'document.download'})}</Button>
            //   }
            // </PDFDownloadLink>
            <Button key={uuidv4()} icon={<DownloadOutlined />} type="primary" onClick={async () => {
              let auditDocument = <AuditDocument item={location.state.docInfo} />;
              asPdf.updateContainer(auditDocument);
              saveAs(await asPdf.toBlob(), docTitle+'_진본확인.pdf');
            }}>{formatMessage({id: 'document.download'})}</Button>
          ]
        }}
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

export default AuditCertify;
