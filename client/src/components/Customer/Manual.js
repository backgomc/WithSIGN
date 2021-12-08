import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import BoardCard from '../Board/BoardCard';
import FAQCard from '../Board/FAQCard';
import OpinionCard from '../Board/OpinionCard';
import DirectCard from './DirectCard';
import { Modal, Input, Row, Col, Space, Button } from "antd";
import Highlighter from 'react-highlight-words';
import { SearchOutlined, DeleteOutlined, FileOutlined, DownloadOutlined, EditOutlined, FormOutlined, FilePdfOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
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
  const { _id } = user;
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({current:1, pageSize:10});
  const [data, setData] = useState([]);
  const [content, setContent] = useState();
  const [boardId, setBoardId] = useState();

  const { formatMessage } = useIntl();

  const fetch = (params = {}) => {
    setLoading(true);

    axios.post('/api/board/list', params).then(response => {

      console.log(response)
      if (response.data.success) {
        const boards = response.data.boards;

        setPagination({...params.pagination, total:response.data.total});
        setData(boards);

        if (boards.length > 0) {
            setContent(boards[0].content)
            setBoardId(boards[0]._id)
            editorRef.current.getInstance().setMarkdown(boards[0].content);
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

  return (
    <div>
    <PageContainer
        ghost
        header={{
          title: formatMessage({id: 'Manual'}),
          ghost: false,
          breadcrumb: {
            routes: [
            ],
          },
          extra: [
            <Button key="1" type="primary" onClick={() => navigate('manualModify', {state: {boardId: boardId}})}>
            {formatMessage({id: 'Modify'})}
          </Button> 
          ],
        }}
        content={'사용자 매뉴얼입니다.'}
        footer={[
        ]}
    >
      <br></br>
      {/* {content} */}
      <div style={{background:'white', margin:'0px', padding:'25px'}}>
        <Viewer ref={editorRef} />
      </div>


    </PageContainer>
    </div>
    
  );
};

export default Manual;
