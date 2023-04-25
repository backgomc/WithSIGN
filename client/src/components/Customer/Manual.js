import React, { useEffect, useState, useRef } from 'react';
import useDidMountEffect from '../Common/useDidMountEffect';
import axios from 'axios';
import axiosInterceptor from '../../config/AxiosConfig';
import PDFViewer from '@niceharu/withpdf';
import { Modal, Input, Row, Col, Space, Button } from "antd";
import Highlighter from 'react-highlight-words';
import { ArrowLeftOutlined, DeleteOutlined, FileOutlined, DownloadOutlined, EditOutlined, FormOutlined, FilePdfOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../app/infoSlice';
import { navigate, Link } from '@reach/router';
import Moment from 'react-moment';
import moment from 'moment';
import 'moment/locale/ko';
import { PageContainer } from '@ant-design/pro-layout';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import { useIntl } from "react-intl";
import styled from 'styled-components';

const PageContainerStyle = styled.div`
.ant-pro-page-container-children-content {
  margin-top: 0px !important; 
  margin-left: 0px !important; 
  margin-right: 0px !important;
}
`;

const Manual = () => {

  const editorRef = useRef();
  const pdfRef = useRef();
  const boardType = 'manual';
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { _id, role } = user;
  const [loading, setLoading] = useState(false);
  const [loadingDownload, setLoadingDownload] = useState([]);
  const [pagination, setPagination] = useState({current:1, pageSize:10});
  const [data, setData] = useState([]);
  const [content, setContent] = useState();
  const [boardId, setBoardId] = useState();
  const [docRef, setDocRef] = useState();
  const [title, setTitle] = useState();
  const [fileName, setFileName] = useState();
  const [instance, setInstance] = useState(null);
  const viewer = useRef(null);
  

  const { formatMessage } = useIntl();

  const fetch = (params = {}) => {
    setLoading(true);

    axiosInterceptor.post('/api/board/list', params).then(response => {

      console.log(response)
      if (response.data.success) {
        const boards = response.data.boards;

        setPagination({...params.pagination, total:response.data.total});
        setData(boards);

        // manual 게시판 최신글에 첫번재 첨부파일을 가져와서 출력함
        if (boards.length > 0) {
          if(boards[0]?.files[0]) {
            setDocRef(boards[0]?.files[0]?.path)
            setFileName(boards[0]?.files[0]?.filename)
          }
            setContent(boards[0]?.content)
            setTitle(boards[0]?.title)
            setBoardId(boards[0]._id)

            // editorRef.current.getInstance().setMarkdown(boards[0].content);
        }

        setLoading(false);

      } else {
          setLoading(false);
          alert(response.data.error)
      }

    });
  };

  const initWithPDF = async () => {
    await pdfRef.current.uploadPDF(docRef);
  }

  useEffect(() => {
    fetch({
        boardType: boardType,
        pagination
      });
  }, []);

  useDidMountEffect(() => {
    initWithPDF();
  }, [docRef]);

  return (
    <div>
    <PageContainerStyle>
    <PageContainer
        // ghost
        header={{
          title: title ? title : formatMessage({id: 'Manual'}),
          ghost: true,
          breadcrumb: {
            routes: [
            ],
          },
          extra: [
          //   <Button key="1" type="primary" onClick={() => navigate('manualModify', {state: {boardId: boardId}})}>
          //   {formatMessage({id: 'Modify'})}
          // </Button> 
          <Button key="1" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
          </Button>,
          role == '1' ?
            <Button key="1" type="primary" onClick={() => navigate('boardList', {state: {boardType: 'manual', boardName: '서비스 소개 자료'}})}>
            {formatMessage({id: 'Modify'})}
            </Button> : '',
            <Button key="3" loading={loadingDownload['1']} href={docRef} download={fileName} type="primary" icon={<DownloadOutlined />} onClick={()=> {
              setLoadingDownload( { "1" : true } )
              setTimeout(() => {
                setLoadingDownload( { "1" : false})
              }, 3000);
            }}>
              {formatMessage({id: 'document.download'})}
            </Button>
          ],
        }}
        style={{height:`calc(100vh - 83px)`}}
        content={<div
                    dangerouslySetInnerHTML={{
                    __html: content
                    }} 
                />}
        footer={[
        ]}
    >
        <div><PDFViewer ref={pdfRef} isUpload={false} isSave={false} isEditing={false} defaultScale={1.0} headerSpace={148}  /></div>

    </PageContainer>
    </PageContainerStyle>
    </div>
    
  );
};

export default Manual;
