import React, { useRef, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { navigate } from '@reach/router';
import { selectUser } from '../../app/infoSlice';
import 'antd/dist/antd.css';
import { Button } from 'antd';
import { useIntl } from "react-intl";
import { PageContainer } from '@ant-design/pro-layout';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import {
  ArrowLeftOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import PDFViewer from "@niceharu/withpdf";
import styled from 'styled-components';
const PageContainerStyle = styled.div`
.ant-pro-page-container-children-content {
  margin-top: 0px !important; 
  margin-left: 0px !important; 
  margin-right: 0px !important;
}
`;

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
  const pdfRef = useRef();

  const initWithPDF = async () => {
    await pdfRef.current.uploadPDF(docRef);
  }

  useEffect(() => {
    initWithPDF();
  }, []);

  return (
    <div>
      <PageContainerStyle>
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
      style={{height:`calc(100vh - 72px)`}}
      // footer={[
      // ]}
    >

      <PDFViewer ref={pdfRef} isUpload={false} isSave={false} isEditing={false} headerSpace={128} />

    </PageContainer>
    </PageContainerStyle>
  </div>
  )

};

export default PreviewPDF;
