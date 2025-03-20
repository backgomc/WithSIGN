import React, { useRef, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import axiosInterceptor from '../../config/AxiosConfig';
import { navigate } from '@reach/router';
import { selectUser } from '../../app/infoSlice';
import form, { ProForm, ProFormText } from '@ant-design/pro-form';
import { Button, message, Form, Typography, Modal, Spin, Upload } from 'antd';
import { useIntl } from "react-intl";
import { PageContainer } from '@ant-design/pro-layout';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  EditOutlined,
  UploadOutlined
} from '@ant-design/icons';
import PDFViewer from "@niceharu/withpdf";
import * as common from "../../util/common";
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
  const [documentCategory, setDocumentCategory] = useState(location.state.documentCategory ? location.state.documentCategory : '');
  const [file, setFile] = useState(null);
  const [fileTitle, setFileTitle] = useState('문서 변경');

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

    let newDocRef = '';
    let pageCount = await pdfRef.current.getPageCount();
    // 파일이 변경된 경우 Upload 처리
    if (file) {
      console.log('file upload called!');

      const filename = `${_id}${Date.now()}.pdf`
      const formData = new FormData()
      formData.append('path', 'templates/')
      formData.append('file', file, filename)
  
      const res = await axiosInterceptor.post(`/api/storage/upload`, formData)

      if (res.data.success){
        newDocRef = res.data.file.path 
      }
    }

    console.log('newDocRef', newDocRef)
    const thumbnail = await pdfRef.current.getThumbnail(0, 0.6);


    let param = {
      templateId: templateId,
      docTitle: docTitle,
      docRef: newDocRef,
      thumbnail: thumbnail,
      pageCount: pageCount,
      category : documentCategory
    }

    console.log('param', param);
    setLoading(true);

    const res = await axiosInterceptor.post('/api/template/updateTemplateInfo', param)
    if (res.data.success) {
      Modal.success({
        content: '템플릿이 수정되었습니다.',
      });
    }

    setLoading(false);

  }

  const propsUpload = {
    name: "file",
    showUploadList: false,
    beforeUpload: (file) => {

      console.log('file', file)
      const isPDF = file.type === 'application/pdf';
      if (!isPDF) {
        message.error(`${file.name} is not a pdf file`);
        return Upload.LIST_IGNORE;
      }
      
      if (file.size > 1048576 * 5) {  //5MB
        console.log(file.size)
        message.error(`filesize(${common.formatBytes(file.size)}) is bigger than 5MB`);
        return Upload.LIST_IGNORE;
      }

      try {
        pdfRef.current.uploadPDF(file); 
        setFile(file);

        const fileName = file.name.normalize('NFC');
        const truncatedFileName =  fileName.length > 10 ? fileName.slice(0, 10) + '...' : fileName;
        setFileTitle(truncatedFileName);

        message.info('수정 버튼을 클릭하여야 최종 반영됩니다!');
      } catch (e) {
        console.log(e);
      }
      
      return false;
    },
    onChange: (info) => {
      console.log(info.fileList);
    },
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

          <Upload {...propsUpload}>
            <Button key="4" icon={<UploadOutlined />}>{fileTitle}</Button>
          </Upload>,

          (role || _id === userId)  && <Button key="2" icon={<EditOutlined />} onClick={() => updateDocument()}>
          {formatMessage({id: 'document.modify'})}
        </Button>,
          <Button key="3" loading={loadingDownload['1']} href={'/api/storage/templates/'+templateId} download={docTitle+'.pdf'} type="primary" icon={<DownloadOutlined />} onClick={()=> {
            setLoadingDownload( { "1" : true } )
            setTimeout(() => {
              setLoadingDownload( { "1" : false})
            }, 3000);
          }}>
            {/* {formatMessage({id: 'document.download'})} */}
          </Button>
        ],
      }}
      style={{height:`calc(100vh - 72px)`}}
      content={[userInfo ? writerInfo : '',
        <ProFormText
          name="documentCategory"
          label="카테고리"
          tooltip="입력하신 카테고리로 표시됩니다."
          placeholder="카테고리를 입력하세요."
          rules={[{ message: formatMessage({id: 'input.documentCategory'}) }]}
          value={documentCategory}
          onChange={(e) => setDocumentCategory(e.target.value)} 
        />]
      }
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
