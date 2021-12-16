import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Table, Input, Space, Button, Descriptions, Form, Comment, Avatar, List, Divider, Modal } from "antd";
import Highlighter from 'react-highlight-words';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../app/infoSlice';
import { navigate } from '@reach/router';
import Moment from 'react-moment';
import moment from "moment";
import 'moment/locale/ko';
import {
  UserOutlined,
  ExclamationCircleOutlined,
  ArrowLeftOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-layout';
import { useIntl } from "react-intl";
import ProCard from '@ant-design/pro-card';
import ProForm, { ProFormTextArea } from '@ant-design/pro-form';
import '@ant-design/pro-form/dist/form.css';
import 'antd/dist/antd.css';
import styled from 'styled-components';
import Media from 'react-media';

const { confirm } = Modal;

const Container = styled.div`
    padding: 0px;
    width: 100%;
    height: 100%;
    background: white;
    img {
      max-width: 100%;
    }
    `;

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
            _id: comment._id,
            userId: comment.user._id,
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

  const fetchDeleteBoard = async (_id) => {
    setLoading(true);
    let param = {
      _ids: [boardId]
    }
    
    const res = await axios.post('/api/board/delete', param)
    if (res.data.success) {
      window.history.back();
    }
    setLoading(false);
  }

  const deleteBoard = async () => {
    confirm({
      title: '삭제하시겠습니까?',
      icon: <ExclamationCircleOutlined />,
      content: '해당 게시글이 영구 삭제됩니다.',
      okText: '네',
      okType: 'danger',
      cancelText: '아니오',
      onOk() {
        fetchDeleteBoard();
      },
      onCancel() {
        console.log('Cancel');
      },
    });    
  }

  const fetchDeleteComment = async (_id) => {
    setLoading(true);
    let param = {
      commentId: _id,
      boardId: boardId
    }
    
    const res = await axios.post('/api/board/deleteComment', param)
    if (res.data.success) {
      fetch({
        boardId: boardId  
      });
    }
    setLoading(false);
  }

  const deleteComment = async (_id) => {
    confirm({
      title: '삭제하시겠습니까?',
      icon: <ExclamationCircleOutlined />,
      content: '해당 댓글이 영구 삭제됩니다.',
      okText: '네',
      okType: 'danger',
      cancelText: '아니오',
      onOk() {
        fetchDeleteComment(_id);
      },
      onCancel() {
        console.log('Cancel');
      },
    });    
  }

  const CommentList = () => (
    <List
      dataSource={comments}
      header={`댓글 ${comments.length}`}
      itemLayout="horizontal"
      renderItem={props => 
        <Comment {...props} 
          actions={[(_id === props.userId) ? <span key="comment-nested-reply-to" onClick={() => { deleteComment(props._id)}}>삭제</span> : '']}
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
          <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
            {/* {formatMessage({id: 'Back'})} */}
          </Button>,
          (_id === board.user._id) ? <Button onClick={e => { {navigate('/boardModify', { state: {boardType:boardType, boardName:'게시글 수정', boardId:boardId}});} }}>수정</Button> : '',
          (_id === board.user._id) ? <Button danger onClick={e => { deleteBoard() }}>삭제</Button> : ''
          ],
        }}
        content={
          <>
          <Descriptions column={2} style={{ marginBottom: -16 }}>
            <Descriptions.Item label="작성자">{board.user.name} {board.user.JOB_TITLE}</Descriptions.Item>
            <Descriptions.Item label="작성 일시"><Moment format='YYYY/MM/DD HH:mm'>{board.requestedTime}</Moment></Descriptions.Item>
          </Descriptions>
          <Divider style= {{marginBottom: '-24px', height: '10px'}}/>
          </>
        }
        footer={[
        ]}
    >
      {/* <Divider style= {{marginTop: '-24px'}} /> */}
      <ProCard direction="column" style={{ width: 'auto', height: '100%', marginTop: '-24px', marginLeft: '-24px', marginRight: '-24px' }}>
        {/* <pre> */}
        <Container>
          <div
            // style={{height:'100%', padding:'10px', fontSize:'calc(13px + .2vw)'}}
            dangerouslySetInnerHTML={{
              __html: board.content
            }} 
          />
        </Container>
        {/* </pre> */}
      </ProCard>

      {/* <Media query="(max-width: 600px)" render={() =>(
        <>
        <Container>
          <div dangerouslySetInnerHTML={{__html:board.content}}></div>
          </Container>
        </>
      )}/>

      <Media query="(min-width: 601px)" render={() => (
        <Container>
            <div dangerouslySetInnerHTML={{__html:board.content}}></div>
        </Container>
      )}/> */}


      
      <div style={{background: 'white', width: 'auto', marginTop: '0px', marginLeft: '-24px', marginRight: '-24px', padding: '20px'}}>
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
