import React, { useEffect, useState, useRef } from 'react';
import useDidMountEffect from '../Common/useDidMountEffect';
import axios from 'axios';
import WebViewer from '@pdftron/webviewer';
import { LICENSE_KEY } from '../../config/Config';
import BoardCard from '../Board/BoardCard';
import FAQCard from '../Board/FAQCard';
import OpinionCard from '../Board/OpinionCard';
import DirectCard from './DirectCard';
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
import { useIntl } from "react-intl";
import { Viewer } from '@toast-ui/react-editor';

const Manual = () => {

  const editorRef = useRef();
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

    axios.post('/api/board/list', params).then(response => {

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

  useEffect(() => {
    fetch({
        boardType: boardType,
        pagination
      });
  }, []);

  useDidMountEffect(() => {
    WebViewer(
      {
        path: 'webviewer',
        licenseKey: LICENSE_KEY,
        disabledElements: [
          'ribbons',
          'toggleNotesButton',
          'contextMenuPopup',
        ],
      },
      viewer.current,
    ).then(async instance => {

      // const { annotManager, Annotations, CoreControls } = instance;
      const { Core, UI } = instance;
      const { annotationManager, Annotations } = Core;

      // select only the view group
      UI.setToolbarGroup('toolbarGroup-View');
      Core.setCustomFontURL("/webfonts/");
      // instance.setToolbarGroup('toolbarGroup-Insert');

      setInstance(instance);

      // load document
      // const storageRef = storage.ref();
      // const URL = await storageRef.child(docRef).getDownloadURL();
      // console.log(URL);

      // DISTO
      const URL = '/' + docRef;
      console.log("URL:"+URL);      
      UI.loadDocument(URL);

      const normalStyles = (widget) => {
        if (widget instanceof Annotations.TextWidgetAnnotation) {
          return {
            // 'background-color': '#a5c7ff',
            color: 'black',
          };
        } else if (widget instanceof Annotations.SignatureWidgetAnnotation) {
          return {
            // border: '1px solid #a5c7ff',
          };
        }
      };

      // TODO annotation 수정 안되게 하기

      annotationManager.addEventListener('annotationChanged', (annotations, action, { imported }) => {
        if (imported && action === 'add') {
          annotations.forEach(function(annot) {
            if (annot instanceof Annotations.WidgetAnnotation) {
              Annotations.WidgetAnnotation.getCustomStyles = normalStyles;

              console.log("annot.fieldName:"+annot.fieldName)
              if (!annot.fieldName.startsWith(_id)) { 
                annot.Hidden = true;
                annot.Listable = false;
              }
            }
          });
        }
      });
      
    });
  }, [docRef]);

  return (
    <div>
    <PageContainer
        ghost
        header={{
          title: title ? title : formatMessage({id: 'Manual'}),
          ghost: false,
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
            <Button key="3" loading={loadingDownload['1']} href={docRef} download={fileName+'.pdf'} type="primary" icon={<DownloadOutlined />} onClick={()=> {
              setLoadingDownload( { "1" : true } )
              setTimeout(() => {
                setLoadingDownload( { "1" : false})
              }, 3000);
            }}>
              {formatMessage({id: 'document.download'})}
            </Button>
          ],
        }}
        content={<div
                    dangerouslySetInnerHTML={{
                    __html: content
                    }} 
                />}
        footer={[
        ]}
    >
      <br></br>
      {/* <div style={{background:'white', margin:'0px', padding:'25px'}}>
        <Viewer ref={editorRef} />
      </div> */}

      <Row gutter={[24, 24]}>
        <Col span={24}>
        <div className="webviewer" ref={viewer}></div>
        </Col>
      </Row>

    </PageContainer>
    </div>
    
  );
};

export default Manual;
