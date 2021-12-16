import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Table, Input, Space, Button, Form } from "antd";
import Highlighter from 'react-highlight-words';
import { SearchOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../app/infoSlice';
import { navigate } from '@reach/router';
import Moment from 'react-moment';
import moment from 'moment';
import 'moment/locale/ko';
import {
  FileOutlined,
  ArrowLeftOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-layout';
import { useIntl } from "react-intl";

import ProCard from '@ant-design/pro-card';
import ProForm, { ProFormUploadDragger, ProFormText, ProFormTextArea } from '@ant-design/pro-form';

import '@ant-design/pro-card/dist/card.css';
import 'antd/dist/antd.css';
import '@ant-design/pro-form/dist/form.css';

// TOAST UI Editor import
import 'codemirror/lib/codemirror.css';
import '@toast-ui/editor/dist/toastui-editor.css';
import { Editor } from '@toast-ui/react-editor';


const { TextArea } = Input;

const BoardModify = ({location}) => {

  const editorRef = useRef();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { _id } = user;

  const boardId = location.state?.boardId ? location.state.boardId : "";
  const boardType = location.state?.boardType ? location.state.boardType : "qna";
  const boardName = location.state?.boardName ? location.state.boardName : "게시글 작성";

  const [form] = Form.useForm();

  const [disableNext, setDisableNext] = useState(true);

  const [board, setBoard] = useState({title: '', content: '', requestedTime: '', user: {name: '', JOB_TITLE:''}});  
  const [loading, setLoading] = useState(false);


  const { formatMessage } = useIntl();
  const searchInput = useRef<Input>(null)

  const fetch = (params = {}) => {
    setLoading(true);

    axios.post('/api/board/detail', params).then(response => {

      console.log(response)
      if (response.data.success) {
        const board = response.data.board;
        setBoard(board);

        form.setFieldsValue({
          title: board.title,
        });

        editorRef.current.getInstance().setHtml(board.content);

        setLoading(false);
      } else {
          setLoading(false);
          alert(response.data.error)
      }

    });
  };

  const onChangeTextHandler = () => {
    console.log('changed !!!')
    console.log(editorRef.current.getInstance().getHtml());

    if (form.getFieldValue("title") && editorRef.current.getInstance().getHtml()) {
      setDisableNext(false)
    } else {
      setDisableNext(true)
    }
  }

  const onFinish = async (values) => {
    console.log(values)

    const editorInstance = editorRef.current.getInstance();
    const contentHtml = editorInstance.getHtml();

    setLoading(true);

    // DB-SAVE
    let body = {
      user: _id,
      boardId: boardId,
      // boardType: boardType,
      title: form.getFieldValue("title"),
      // content: form.getFieldValue("content"),
      content: contentHtml
    }
    console.log(body)
    const res = await axios.post('/api/board/modify', body)

    setLoading(false);

    window.history.back();
    // navigate('/boardList', { state: {boardType:boardType, boardName:boardName}}); 

  }

  useEffect(() => {

    fetch({
      boardId: boardId  
    });

  }, []);

  return (
    <div>
    <PageContainer
        ghost
        header={{
          title: formatMessage({id: boardName}),
          ghost: false,
          extra: [   
          <Button key="1" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
            {/* {formatMessage({id: 'Back'})} */}
          </Button>,
          <Button key="2" icon={<ReloadOutlined />} onClick={() => form.resetFields()}>
            {/* {formatMessage({id: 'Initialize'})} */}
          </Button>,        
          <Button key="3" type="primary" disabled={disableNext} onClick={() => form.submit()}>
            {formatMessage({id: 'Save'})}
          </Button>
          ],
        }}
        // content={'자주 사용하는 문서를 미리 등록할 수 있습니다.'}
        footer={[
        ]}
    >
    <br />
    <ProCard direction="column" gutter={[0, 16]}>
      <ProForm 
        form={form}
        onFinish={onFinish}
        submitter={{
          // Configure the properties of the button
          resetButtonProps: {
            style: {
              // Hide the reset button
              display: 'none',
            },
          },
          submitButtonProps: {
            style: {
              // Hide the reset button
              display: 'none',
            },
          }
        }}
        onValuesChange={(changeValues) => {
          console.log("onValuesChange called")
          console.log(changeValues)
          // console.log('form.getFieldValue("title"):'+form.getFieldValue("title"))

          // if (form.getFieldValue("title") && form.getFieldValue("content")) {
            if (form.getFieldValue("title") && editorRef.current.getInstance().getHtml()) {
            setDisableNext(false)
          } else {
            setDisableNext(true)
          }
        }}
      >
        <ProFormText
          name="title"
          label="제목"
          // width="md"
          // tooltip="입력하신 템플릿명으로 표시됩니다."
          placeholder="제목을 입력하세요."
          rules={[{ required: true, message: formatMessage({id: 'input.boardTitle'}) }]}
        />

        {/* <ProFormTextArea 
          label="내용" 
          name="content"
          // width="lg"
          fieldProps={{showCount: true, allowClear: true, rows: '15'}}
          rules={[{ autoSize: true, required: true, message: formatMessage({id: 'input.boardContent'}) }]}
        /> */}

        <Editor
          initialValue=""
          usageStatistics={false}
          ref={editorRef}
          height="58vh"
          initialEditType="wysiwyg" // wysiwyg | markdown
          onChange={onChangeTextHandler}
          // plugins={[colorSyntax]}
          // plugins={[chart, codeSyntaxHighlight, colorSyntax, tableMergedCell, uml]}
        />

      </ProForm>
    </ProCard>  
      
    </PageContainer>
    </div>
    
  );
};

export default BoardModify;
