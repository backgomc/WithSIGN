import React, { useRef, useEffect, useState } from 'react';
import { useIntl } from "react-intl";
import { navigate } from '@reach/router';
import { Row, Col, Button } from 'antd';
import { PageContainer } from '@ant-design/pro-layout';
import { DownloadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import RcResizeObserver from 'rc-resize-observer';
import { LICENSE_KEY } from '../../config/Config';
import WebViewer from '@pdftron/webviewer';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import Audit from './Audit';

const asPdf = pdf([]);

const AuditDocument = ({location}) => {
  
  const [responsive, setResponsive] = useState(false);
  
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
        'contextMenuPopup'
      ]
    },
    viewer.current
    ).then(async instance => {
      const { annotManager, Annotations, CoreControls } = instance;

      // select only the view group
      instance.setToolbarGroup('toolbarGroup-View');
      CoreControls.setCustomFontURL('/webfonts/');
      
      // DISTO
      // const URL = '/' + docRef;
      // console.log('URL:'+URL);
      // instance.docViewer.loadDocument(URL);
      let audit = <Audit item={location.state.docInfo} />;
      asPdf.updateContainer(audit);
      instance.docViewer.loadDocument(await asPdf.toBlob(), { filename: docTitle+'_진본확인.pdf' });

      const normalStyles = (widget) => {
        if (widget instanceof Annotations.TextWidgetAnnotation) {
          return {
            color: 'black'
          };
        } else if (widget instanceof Annotations.SignatureWidgetAnnotation) {
          return {
          };
        }
      };

      // TODO annotation 수정 안되게 하기
      annotManager.on('annotationChanged', (annotations, action, { imported }) => {
        console.log('annotationChanged called');
        if (imported && action === 'add') {
          annotations.forEach(function(annot) {
            console.log('annot', annot);
            if (annot instanceof Annotations.WidgetAnnotation) {
              Annotations.WidgetAnnotation.getCustomStyles = normalStyles;
              console.log("annot.fieldName:"+annot.fieldName);
              // if (!annot.fieldName.startsWith(_id)) { 
              //   annot.Hidden = true;
              //   annot.Listable = false;
              // }
              // 모든 입력 필드 숨기기
              annot.Hidden = true;
            }
          });
        }
      });
    });
  }, []);

  return (
    <div>
      <PageContainer
        header={{
          title: '진본 확인 증명서',
          extra: [
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/documentList')}></Button>,
            // <PDFDownloadLink document={<MyDocument />} fileName={docTitle+'_진본확인.pdf'}>
            //   {
            //     ({ blob, url, loading, error }) => <Button key="1" loading={loading} type="primary" icon={<DownloadOutlined />}>{formatMessage({id: 'document.download'})}</Button>
            //   }
            // </PDFDownloadLink>
            <Button icon={<DownloadOutlined />} type="primary" onClick={async () => {
              let audit = <Audit item={location.state.docInfo} />;
              asPdf.updateContainer(audit);
              saveAs(await asPdf.toBlob(), docTitle+'_진본확인.pdf');
            }}>{formatMessage({id: 'document.download'})}</Button>

          ]
        }}
      >
        <RcResizeObserver
          key="resize-observer"
          onResize={(offset) => {
            setResponsive(offset.width < 596);
          }}
        >
          <Row gutter={[24, 24]}>
            <Col span={24}>
              <div className='webviewer' ref={viewer}></div>
            </Col>
          </Row>
        </RcResizeObserver>
      </PageContainer>
    </div>
  );
};

export default AuditDocument;
