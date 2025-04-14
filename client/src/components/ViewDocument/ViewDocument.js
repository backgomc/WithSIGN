import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import axiosInterceptor from '../../config/AxiosConfig';
import { useSelector } from 'react-redux';
import { navigate, Link } from '@reach/router';
import { Row, Col, Button, Badge, List } from 'antd';
import { selectDocToView } from './ViewDocumentSlice';
import { selectUser, selectHistory } from '../../app/infoSlice';
import './ViewDocument.css';
import { useIntl } from "react-intl";
import RcResizeObserver from 'rc-resize-observer';
import { PageContainer } from '@ant-design/pro-layout';
import ProCard from '@ant-design/pro-card';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import { DownloadOutlined, ArrowLeftOutlined, CheckCircleTwoTone, PaperClipOutlined, PrinterOutlined } from '@ant-design/icons';
import {DOCUMENT_SIGNED, DOCUMENT_TOSIGN, DOCUMENT_SIGNING, DOCUMENT_CANCELED, DOCUMENT_TOCONFIRM, DOCUMENT_TODO, TYPE_SIGN, TYPE_IMAGE, TYPE_TEXT, TYPE_CHECKBOX, TYPE_DROPDOWN} from '../../common/Constants';
import PDFViewer from "@niceharu/withpdf";
import styled from 'styled-components';

// const PageContainerStyle = styled.div`
// .ant-row {
//   margin-top: -24px !important; 
//   margin-left: -35px !important; 
//   margin-right: -24px !important;
// } 
// `;
const PageContainerStyle = styled.div`
.ant-pro-page-container-children-content {
  margin-top: 0px !important; 
  margin-left: 0px !important; 
  margin-right: 0px !important;
}
`;

const ViewDocument = ({location}) => {
  const [instance, setInstance] = useState(null);
  const [responsive, setResponsive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDownload, setLoadingDownload] = useState([]);
  const [chkeckDownload, setCheckDownload] = useState(false);

  const doc = useSelector(selectDocToView);
  const user = useSelector(selectUser);
  const history = useSelector(selectHistory);

  const { docRef, docTitle, docId, status, downloads, isWithPDF, attachFiles } = doc;
  const { _id } = user;
  const { formatMessage } = useIntl();

  const viewer = useRef(null);
  const pdfRef = useRef();


  const initWithPDF = async () => {
    await pdfRef.current.uploadPDF(docRef, docTitle);

    console.log('status', status)
    if (status !== DOCUMENT_SIGNED) { // items import (완료되지 않은 경우)
      let param = {
        docId: docId,
      }
      let items;
      const res = await axiosInterceptor.post('/api/document/document', param)
      if (res.data.success) {
        items = res.data.document.items;
      }
  
      let renewItems = items.map(item => {
        item.required = false;
        item.disable = true;
        item.borderColor = 'transparent';
        
        if ((item.type === (TYPE_SIGN || TYPE_IMAGE)) && !item.payload) {
          item.hidden = true;
        }
        if (item.type === TYPE_TEXT) {
          if (item.lines.length < 1 || item.lines[0].length < 1) {
            item.hidden = true;
          }
        }
        if (item.type === TYPE_CHECKBOX && !item.checked) {
          item.hidden = true;
        }
        if (item.type === TYPE_DROPDOWN) {
          if (item.lines.length < 1 || item.lines[0].length < 1) {
            item.hidden = true;
          }
        }
        return item;
      })
      await pdfRef.current.importItems(renewItems);
    }

  }

  useEffect(() => {
    initWithPDF();
  }, [docRef, _id]);

  const download = () => {
    instance.downloadPdf(true);
  };

  const doneViewing = async () => {
    navigate(history ? history : '/documentList');
  }

  const listAttachFiles = (
    <List
    size="small"
    split={false}
    dataSource={attachFiles}
    itemLayout="horizontal"
    renderItem={item =>
        <List.Item.Meta
            avatar={<PaperClipOutlined />}
            description={ <a href={item.path} download={item.originalname} style={{color:'gray'}}>{item.originalname}</a> }
        />
    }
    />
  )

  function printPdfByUrl (pdfUrl) {
    var iframe = document.createElement('iframe');
    iframe.style.display = "none";
    iframe.src = pdfUrl;
    document.body.appendChild(iframe);
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  }

  const printPdfByFile = async () => {
    // 현재 화면에 출력된 컴포넌트 기준으로 PDF를 신규로 생성하여 PRINT 진행
    const mergedFile = await pdfRef.current.savePDF(true, false);

    var iframe = document.createElement('iframe');
    iframe.style.display = "none";
    iframe.src = URL.createObjectURL(mergedFile);;
    document.body.appendChild(iframe);
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  }
    
  return (
    <div>
    <PageContainerStyle>
    <PageContainer      
      // ghost
      header={{
        title: docTitle ? docTitle : "문서 조회",
        ghost: true,
        breadcrumb: {
          routes: [
          ],
        },
        extra: [
          <Button key="2" icon={<ArrowLeftOutlined />} onClick={() => {
            // console.log('pagination cccc', location?.state?.pagination)
            // let pagination = {current:3, pageSize:10, showSizeChanger:true, pageSizeOptions: ["10", "20", "30"]}

            // 대량전송 상세보기 이동시 페이지 유지 처리 
            location?.state?.bulk ? navigate('/bulkDetail', { state: {bulk: location?.state?.bulk, pagination: location?.state?.pagination} }) : ( location?.state?.pagination ? navigate('/documentList', { state: {pagination: location?.state?.pagination} }) : window.history.back())

            // location?.state?.pagination ? navigate('/documentList', { state: {pagination: location?.state?.pagination} }) : window.history.back();
          }}> 
          {/* <Button key="2" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>  */}
            {/* {formatMessage({id: 'Back'})} */}
          </Button>,
          // <Button key="3" type="primary" onClick={() => download()} icon={<DownloadOutlined />}>
          //   {formatMessage({id: 'document.download'})}
          // </Button>
          // AS-IS > TO-BE : 해시값 유지를 위해 서버에 파일을 다운로드 하도록 변경
          // <a href={process.env.REACT_APP_STORAGE_DIR+docRef} download={docTitle+'.pdf'}> 
            // <Button key="3" loading={loadingDownload['1']} href={docRef} download={docTitle+'.pdf'} type="primary" icon={<DownloadOutlined />} onClick={()=> {
          
          <Button icon={<PrinterOutlined />} onClick={()=> {
            // (status == DOCUMENT_SIGNED) ? printPdfByUrl('/api/storage/documents/'+docId) : printPdfByFile()
            printPdfByFile()  // DRM 문제로 서명완료시도 현재 파일을 출력하도록 변경
          }}></Button>,  
          // 서명 완료된 문서만 다운로드 되도록 수정 
          (status == DOCUMENT_SIGNED) ? <Badge count={downloads?.find(e => e === _id)||chkeckDownload?<CheckCircleTwoTone />:0}><Button key="3" loading={loadingDownload['1']} href={'/api/storage/documents/'+docId} download={docTitle+'.pdf'} type="primary" icon={<DownloadOutlined />} onClick={()=> {
            axiosInterceptor.post('/api/document/updateDownloads', {docId:docId, usrId:_id});
            setCheckDownload(true);
            setLoadingDownload( { "1" : true } );
            setTimeout(() => {
              setLoadingDownload( { "1" : false } );
            }, 3000);
          }}>
            {formatMessage({id: 'document.download'})}
          </Button></Badge> : ''
        ],
      }}
      style={{height:`calc(100vh - 72px)`}}
      content= {attachFiles?.length > 0 && listAttachFiles}
      // content= {}
      // footer={[
      // ]}
      loading={loading}
    >

        <PDFViewer ref={pdfRef} isUpload={false} isSave={false} isEditing={false} defaultScale={1.0} headerSpace={attachFiles?.length > 0 ? 128 + attachFiles?.length * 30 : 128}></PDFViewer>

    </PageContainer> 
    </PageContainerStyle>

      {/* <Box display="flex" direction="row" flex="grow">
        <Column span={2}>
          <Box padding={3}>
            <Heading size="md">View Document</Heading>
          </Box>
          <Box padding={3}>
            <Row gap={1}>
              <Stack>
                <Box padding={2}>
                  <Button
                    onClick={download}
                    accessibilityLabel="download signed document"
                    text="Download"
                    iconEnd="download"
                  />
                </Box>
                <Box padding={2}>
                  <Button
                    onClick={doneViewing}
                    accessibilityLabel="complete signing"
                    text="Done viewing"
                    iconEnd="check"
                  />
                </Box>
              </Stack>
            </Row>
          </Box>
        </Column>
        <Column span={10}>
          <div className="webviewer" ref={viewer}></div>
        </Column>
      </Box> */}
    </div>
  );
};

export default ViewDocument;
