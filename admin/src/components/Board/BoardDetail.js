import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Descriptions, Form, Comment, Avatar, List, Divider, Modal, Tooltip } from "antd";
import { useSelector } from 'react-redux';
import { selectUser } from '../../app/infoSlice';
import { navigate } from '@reach/router';
import Moment from 'react-moment';
import moment from "moment";
import 'moment/locale/ko';
import { UserOutlined, ExclamationCircleOutlined, ArrowLeftOutlined, DeleteOutlined, EditOutlined, ReloadOutlined, PaperClipOutlined, FormOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-layout';
import { useIntl } from "react-intl";
import ProCard from '@ant-design/pro-card';
import ProForm, { ProFormTextArea } from '@ant-design/pro-form';
import '@ant-design/pro-form/dist/form.css';
import 'antd/dist/antd.css';

const { confirm } = Modal;

const BoardDetail = ({location}) => {

  const user = useSelector(selectUser);
  const { _id, thumbnail } = user;

  const boardId = location.state.boardId;
  const boardType = location.state.boardType;

  const [comments, setComments] = useState([]);
  const [files, setFiles] = useState([]);
  const [board, setBoard] = useState({title: '', requestedTime: '', user: {name: '', JOB_TITLE:''}});
  const [loading, setLoading] = useState(false);

  const { formatMessage } = useIntl();
  const [form] = Form.useForm();

  const getBoardType = (value = {}) => {
    let text = '';
    if (value === 'notice') text = '공지사항';
    if (value === 'faq') text = 'FAQ';
    if (value === 'opinion') text = '문의하기';
    if (value === 'manual') text = '매뉴얼';
    return text;
  }

  const fetch = (params = {}) => {
    setLoading(true);
    axios.post('/admin/board/detail', params).then(response => {
      if (response.data.success) {
        let board = response.data.board;
        setBoard(board);

        // 댓글 셋팅
        let commentData = []
        board.comments.forEach(comment => {
          commentData.push({
            _id: comment._id,
            userId: comment.user._id,
            author: comment.user.name + ' ' + comment.user.JOB_TITLE,
            avatar: comment.user.thumbnail ? <Avatar src={comment.user.thumbnail} /> : <Avatar size={35} icon={<UserOutlined />} />,
            content: <pre>{comment.content}</pre>,
            datetime: moment(comment.registeredTime).fromNow()
          });
        });
        setComments(commentData);

        // 파일 셋팅
        setFiles(board.files);

        setLoading(false);
      } else {
        alert(response.data.error);
        setLoading(false);
      }
    });
  };

  const fetchDeleteBoard = async (_id) => {
    setLoading(true);
    let param = {
      boardId: [boardId]
    }
    
    let res = await axios.post('/admin/board/delete', param);
    if (res.data.success) {
      navigate('/boardList');
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
    
    let res = await axios.post('/admin/board/delComment', param);
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
        <Comment {...props} actions={
            [<span key="comment-nested-reply-to" onClick={() => { deleteComment(props._id); }}>삭제</span>]
          }
        />}
    />
  );

  const FileList = () => (
    <List
      size="small"
      split={false}
      dataSource={files}
      header={`첨부파일 ${files.length}`}
      bordered
      itemLayout="horizontal"
      renderItem={item =>
        <List.Item>
          <List.Item.Meta
            avatar={<PaperClipOutlined />}
            description={ <a href={item.path} download={item.originalname} style={{color:'gray'}}>{item.originalname}</a> }
          />
        </List.Item>
      }
    />
  );

  const onFinish = async (values) => {
    console.log(values);

    setLoading(true);

    // DB-SAVE
    let body = {
      user: _id,
      boardId: boardId,
      content: form.getFieldValue('content')
    }
    
    await axios.post('/admin/board/addComment', body);

    setLoading(false);
    form.resetFields();

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
            submitText: '',
            resetText: ''
          },
          resetButtonProps: {
            icon: <ReloadOutlined />
          },
          submitButtonProps: {
            icon: <FormOutlined />,
            style: {
            }
          }
        }}
      >
        <ProFormTextArea 
          name="content"
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
    return () => {
      setComments([]);
      setFiles([]);
      setBoard({title: '', requestedTime: '', user: {name: '', JOB_TITLE:''}});
      setLoading(false);
    } // cleanup
  }, []);

  return (
    <div>
      <PageContainer
        header={{
          title: '['+getBoardType(boardType)+'] '+board.title,
          extra: [
            <Button icon={<ArrowLeftOutlined />} onClick={() => { navigate('/boardList'); }}>
              {/* {formatMessage({id: 'Back'})} */}
            </Button>,
            <Tooltip placement="bottom" title="게시글 수정"><Button icon={<EditOutlined />} onClick={e => { navigate('/boardModify', { state: {boardId: boardId, boardType: boardType} }); } }></Button></Tooltip>,
            <Tooltip placement="bottom" title="게시글 삭제"><Button icon={<DeleteOutlined />} onClick={e => { deleteBoard(); } } danger ></Button></Tooltip>
          ],
        }}
        content={
          <>
            <Divider style={{margin: '0px', height: '10px'}}/>
            <Descriptions column={2}>
              <Descriptions.Item label="작성자" style={{paddingBottom: '0px'}}>{board.user?board.user.name:''} {board.user?board.user.JOB_TITLE:''}</Descriptions.Item>
              <Descriptions.Item label="작성일시" style={{paddingBottom: '0px'}}><Moment format="YYYY/MM/DD HH:mm">{board.registeredTime}</Moment></Descriptions.Item>
            </Descriptions>
          </>
        }
        loading={loading}
        style={{background: 'white'}}
      >
      <ProCard direction="column" style={{ width: 'auto', height: '100%'}}>
        <div dangerouslySetInnerHTML={{ __html: board.content }} />
      </ProCard>

      {files.length > 0 ? <div style={{background: 'white', width: 'auto'}}><FileList /></div> : ''}

      <div style={{background: 'white', width: 'auto', marginTop: '30px'}}>
      {comments.length > 0 && <CommentList />}
        <Comment
          avatar={thumbnail ? <Avatar src={thumbnail} /> : <Avatar size={35} icon={<UserOutlined />} />}
          content={<Editor />}
        />
      </div>
    </PageContainer>
    </div>  
  );
};

export default BoardDetail;
