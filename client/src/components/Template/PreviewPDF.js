import React, { useRef, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { navigate } from '@reach/router';
import { selectUser } from '../../app/infoSlice';

import { Button, TreeSelect, Form, Typography, Modal, Spin } from 'antd';
import { useIntl } from "react-intl";
import { PageContainer } from '@ant-design/pro-layout';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  EditOutlined
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

  const templateId = location.state.templateId
  const docRef = location.state.docRef
  const userId = location.state.userInfo?._id
  const userInfo = location.state.userInfo


  const [form] = Form.useForm();
  const [instance, setInstance] = useState(null)
  const [loading, setLoading] = useState(false);
  const [loadingDownload, setLoadingDownload] = useState([]);
  const [docTitle, setDocTitle] = useState(location.state.docTitle ? location.state.docTitle : '');


  const user = useSelector(selectUser);
  const { _id, role } = user;
  const viewer = useRef(null);
  const pdfRef = useRef();

  const initWithPDF = async () => {
    await pdfRef.current.uploadPDF(docRef);
  }

  useEffect(() => {
    initWithPDF();
  }, []);

  const writerInfo = (
    <div>등록자 : {userInfo?.name + ' ' + userInfo?.JOB_TITLE}</div>  
  )

  const updateDocument = async () => {

    let param = {
      templateId: templateId,
      docTitle: docTitle
    }

    console.log('param', param);
    setLoading(true);

    const res = await axios.post('/api/template/updateTemplateInfo', param)
    if (res.data.success) {
      Modal.success({
        content: '템플릿명이 수정되었습니다.',
      });
    }

    setLoading(false);

  }
  return (
    <div>
      <PageContainerStyle>
      <PageContainer
      // loading={loading}
      ghost
      header={{
        title: (role || _id === userId) ? <Typography.Title editable={{onChange: (text) => {setDocTitle(text)}, tooltip: false}} level={4} style={{ margin: 0 }} >{docTitle}</Typography.Title> : docTitle,
        ghost: false,
        breadcrumb: {
          routes: [
          ],
        },
        extra: [
          <Button key="1" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
            {/* {formatMessage({id: 'Back'})} */}
          </Button>,
          (role || _id === userId)  && <Button key="2" icon={<EditOutlined />} onClick={() => updateDocument()}>
          {formatMessage({id: 'document.modify'})}
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
      content={userInfo ? writerInfo : ''}
      // footer={[
      // ]}
    >
      <Spin tip="로딩중..." spinning={loading}>
        <PDFViewer ref={pdfRef} isUpload={false} isSave={false} isEditing={false} headerSpace={128} />
      </Spin>

    </PageContainer>
    </PageContainerStyle>
  </div>
  )

};

export default PreviewPDF;
