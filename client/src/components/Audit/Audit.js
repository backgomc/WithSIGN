import React, {useEffect, useRef} from 'react';
import ReactPDF, { Page, Text, View, Document, StyleSheet, Font, PDFDownloadLink, usePDF } from '@react-pdf/renderer';
import { Row, Col, Button } from "antd";
import { PageContainer } from '@ant-design/pro-layout';
import { useIntl } from "react-intl";
import Header from './Header';
import List, { Item } from './List';
import Moment from 'react-moment';

// import font from '../../assets/font/NanumGothic-ExtraBold.ttf';
import font from '../../assets/font/NanumGothic.ttf';
import font_Bold from '../../assets/font/NanumGothic-ExtraBold.ttf';
import { navigate } from '@reach/router';

import { ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import AuditDocument from './AuditDocument';
import PDFViewer from "@niceharu/withpdf";
import styled from 'styled-components';
const PageContainerStyle = styled.div`
.ant-pro-page-container-children-content {
  margin-top: 0px !important; 
  margin-left: 0px !important; 
  margin-right: 0px !important;
}
`;

const asPdf = pdf([]);

const Audit = ({location}) => {

  const { formatMessage } = useIntl();
  const item = location.state.item
  
  // const docTitle = item.docTitle.normalize('NFC') // 한글 자소 분리 문제 해결 (참조: https://egg-programmer.tistory.com/293) 
  const { docTitle } = location.state.docInfo;

  const viewer = useRef(null);
  const pdfRef = useRef();

  const initWithPDF = async () => {

    let auditDocument = <AuditDocument item={location.state.docInfo} />;
    asPdf.updateContainer(auditDocument);
    await pdfRef.current.uploadPDF(await asPdf.toBlob(), docTitle+'_진본확인.pdf');
  }

  useEffect(() => {
    initWithPDF();
  }, []);

  return (
    
    <div>
    <PageContainerStyle>
    <PageContainer
        // ghost
        // loading={loading}
        header={{
          // title: board ? board.title : '',
          title: '진본 확인 증명서',
          // ghost: false,
          extra: [           
        //   <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/documentList')}>
        //   </Button>,
        //   <PDFDownloadLink document={<MyDocument />} fileName={docTitle+'_진본확인.pdf'}>
        //   {({ blob, url, loading, error }) =>
        //     <Button key="1" loading={loading} type="primary" icon={<DownloadOutlined />}>
        //         {formatMessage({id: 'document.download'})}
        //     </Button>
        //   }
        // </PDFDownloadLink>
            <Button key="1" icon={<ArrowLeftOutlined />} onClick={() => navigate('/documentList')}></Button>,
            <Button key="2" icon={<DownloadOutlined />} type="primary" onClick={async () => {
              let auditDocument = <AuditDocument item={location.state.docInfo} />;
              asPdf.updateContainer(auditDocument);
              saveAs(await asPdf.toBlob(), docTitle+'_진본확인.pdf');
            }}>{formatMessage({id: 'document.download'})}</Button>
          ],
        }}
        style={{height:`calc(100vh - 72px)`}}
        // footer={[
        // ]}
    >
      <PDFViewer ref={pdfRef} isUpload={false} isSave={false} isEditing={false} headerSpace={128} /> 
    </PageContainer>
    </PageContainerStyle>
    </div>

  );

};

export default React.memo(Audit);