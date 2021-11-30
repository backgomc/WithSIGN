import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Table, Input, Space, Button, Popconfirm, List, Comment, Avatar, Form } from "antd";
import Highlighter from 'react-highlight-words';
import { SearchOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../app/infoSlice';
import { navigate } from '@reach/router';
import Moment from 'react-moment';
import moment from 'moment';
import 'moment/locale/ko';
import {
  FileOutlined
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-layout';
import 'antd/dist/antd.css';
import '@ant-design/pro-form/dist/form.css';
import { useIntl } from "react-intl";
import ProForm, { ProFormUploadDragger, ProFormText, ProFormTextArea } from '@ant-design/pro-form';


const { TextArea } = Input;

const OpinionList = ({location}) => {

  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { _id } = user;
  const { formatMessage } = useIntl();

  const [form] = Form.useForm();

  const boardType = location.state?.boardType ? location.state.boardType : "opinion";
  const boardName = location.state?.boardName ? location.state.boardName : "Opinion";
  const boardDetail = location.state?.boardDetail ? location.state.boardDetail : "개선 및 문의 사항을 보낼 수 있습니다.";
  
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({current:1, pageSize:10});
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState('');

  const CommentList = () => (
    <List
      dataSource={data}
      header={`${data.length} ${data.length > 1 ? 'articles' : 'article'}`}
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
      boardType: boardType,
      title: '무제',
      content: form.getFieldValue("content"),
    }
    console.log(body)
    const res = await axios.post('/api/board/add', body)

    setLoading(false);

    fetch({
      boardType: boardType,
      pagination,
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
            console.log("AA")
          } else {
            // setDisableNext(true)
            console.log("BB")
          }
        }}
      >

        <ProFormTextArea 
          // label="내용" 
          name="content"
          // width="lg"
          fieldProps={{showCount: true, allowClear: true, rows: '5'}}
          rules={[{ autoSize: true, required: true, message: formatMessage({id: 'input.boardContent'}) }]}
        />

      </ProForm>

    </>
  );


  const fetch = (params = {}) => {
    setLoading(true);

    axios.post('/api/board/list', params).then(response => {

      console.log(response)
      if (response.data.success) {
        const boards = response.data.boards;

        setPagination({...params.pagination, total:response.data.total});

        var tempData = []
        boards.map(board => {
          tempData.push({
            author: board.user.name + ' ' + board.user.JOB_TITLE,
            avatar: 'https://joeschmoe.io/api/v1/random',
            content: <pre>{board.content}</pre>,
            datetime: moment(board.registeredTime).fromNow()
          })
        })

        setData(tempData)

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
      pagination,
    });

  }, []);

  return (
    <div>
    <PageContainer
        ghost
        header={{
          title: formatMessage({id: boardName}),
          ghost: false,
          breadcrumb: {
            routes: [
            ],
          },
          extra: [           
          <Button type="primary" onClick={() => {navigate('/boardWrite', { state: {boardType:boardType, boardName:boardName}});}}>
            의견 등록
          </Button>
          ],
        }}
        content={boardDetail}
        footer={[
        ]}
    >
      <div style={{background: 'white', marginTop: '25px', padding: '20px'}}>
      {data.length > 0 && <CommentList />}
        <Comment
          avatar={<Avatar src="https://joeschmoe.io/api/v1/random" alt="Han Solo" />}
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

export default OpinionList;
