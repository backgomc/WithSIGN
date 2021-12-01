import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Table, Input, Space, Button, Descriptions, Form, Comment, Avatar, List } from "antd";
import Highlighter from 'react-highlight-words';
import { SearchOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../app/infoSlice';
import { navigate } from '@reach/router';
import { setDocToView } from '../ViewDocument/ViewDocumentSlice';
import Moment from 'react-moment';
import moment from "moment";
import 'moment/locale/ko';
import { DocumentType, DocumentTypeText, DocumentTypeIcon, DOCUMENT_SIGNED, DOCUMENT_TOSIGN, DOCUMENT_SIGNING, DOCUMENT_CANCELED } from '../Lists/DocumentType';
import {
  UserOutlined
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-layout';
import { useIntl } from "react-intl";
import ProCard from '@ant-design/pro-card';
import ProForm, { ProFormUploadDragger, ProFormText, ProFormTextArea } from '@ant-design/pro-form';
import '@ant-design/pro-form/dist/form.css';
import 'antd/dist/antd.css';

const BoardDetail = ({location}) => {

  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const boardId = location.state.boardId;
  const boardType = location.state?.boardType ? location.state.boardType : "opinion";

  const { _id, thumbnail } = user;
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [comments, setComments] = useState([]);
  const [board, setBoard] = useState({title: '', requestedTime: '', user: {name: '', JOB_TITLE:''}});
  const [loading, setLoading] = useState(false);

  const { formatMessage } = useIntl();
  const [form] = Form.useForm();


  const fetch = (params = {}) => {
    setLoading(true);

    axios.post('/api/board/detail', params).then(response => {

      console.log(response)
      if (response.data.success) {
        const board = response.data.board;
        setBoard(board);

        // 댓글 셋팅
        var tempData = []
        board.comments.map(comment => {
          tempData.push({
            author: comment.user.name + ' ' + comment.user.JOB_TITLE,
            avatar: thumbnail ? <Avatar src={thumbnail} /> : <Avatar size={35} icon={<UserOutlined />} />,
            content: <pre>{comment.content}</pre>,
            datetime: moment(comment.registeredTime).fromNow()
          })
        })
        setComments(tempData);

        setLoading(false);
      } else {
          setLoading(false);
          alert(response.data.error)
      }

    });
  };

  const CommentList = () => (
    <List
      dataSource={comments}
      header={`댓글 ${comments.length}`}
      itemLayout="horizontal"
      renderItem={props => <Comment {...props} actions={[<span key="comment-nested-reply-to">Reply to</span>]}
      />}     
    />
  );

  const onFinish = async (values) => {
    console.log(values)

    setLoading(true);

    // DB-SAVE
    let body = {
      user: _id,
      boardId: boardId,
      content: form.getFieldValue("content"),
    }
    console.log(body)
    const res = await axios.post('/api/board/addComment', body)

    setLoading(false);

    fetch({
      boardId: boardId  
    });

  }

  const Editor = () => (
    <>
      <ProForm 
        form={form}
        onFinish={onFinish}
        submitter={{
          searchConfig: {
            submitText: '등록',
          },      
          // Configure the properties of the button
          resetButtonProps: {
            // style: {
            //   // Hide the reset button
            //   display: 'none',
            // },
          },
          submitButtonProps: {
            style: {
              // Hide the reset button
              // display: 'none',
            },
          }
        }}
        onValuesChange={(changeValues) => {
          console.log("onValuesChange called")
          console.log(changeValues)
          // console.log('form.getFieldValue("title"):'+form.getFieldValue("title"))

          if (form.getFieldValue("content")) {
            // setDisableNext(false)
          } else {
            // setDisableNext(true)
          }
        }}
      >

        <ProFormTextArea 
          // label="내용" 
          name="content"
          // width="lg"
          fieldProps={{showCount: true, allowClear: true, rows: '4'}}
          rules={[{ autoSize: true, required: true, message: formatMessage({id: 'input.boardContent'}) }]}
        />

      </ProForm>

    </>
  );

  useEffect(() => {

    fetch({
      boardId: boardId  
    });

  }, []);

  return (
    <div>
    <PageContainer
        // ghost
        loading={loading}
        header={{
          // title: board ? board.title : '',
          title: board.title,
          // ghost: false,
          extra: [           
          <Button onClick={() => window.history.back()}>
            {formatMessage({id: 'Back'})}
          </Button>
          ],
        }}
        content={
          <Descriptions column={2} style={{ marginBottom: -16 }}>
            <Descriptions.Item label="작성자">{board.user.name} {board.user.JOB_TITLE}</Descriptions.Item>
            <Descriptions.Item label="작성 일시"><Moment format='YYYY/MM/DD HH:mm'>{board.requestedTime}</Moment></Descriptions.Item>
          </Descriptions>
        }
        footer={[
        ]}
    >

      <ProCard direction="column" style={{ height: '100%' }}>
        <pre>
          <div
            style={{height:'100%', padding:'10px', fontSize:'calc(13px + .2vw)'}}
            dangerouslySetInnerHTML={{
              __html: board.content
            }} 
          />
        </pre>
      </ProCard>

      <div style={{background: 'white', marginTop: '25px', padding: '20px'}}>
      {comments.length > 0 && <CommentList />}
        <Comment
          avatar={thumbnail ? <Avatar src={thumbnail} /> : <Avatar size={35} icon={<UserOutlined />} />}
          content={
            <Editor
            />
          }
        />
      </div>
      
    </PageContainer>
    </div>
    
  );
};

export default BoardDetail;
