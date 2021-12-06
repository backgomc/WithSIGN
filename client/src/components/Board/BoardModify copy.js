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
  FileOutlined
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-layout';
import { useIntl } from "react-intl";

import ProCard from '@ant-design/pro-card';
import ProForm, { ProFormUploadDragger, ProFormText, ProFormTextArea } from '@ant-design/pro-form';

import '@ant-design/pro-card/dist/card.css';
import 'antd/dist/antd.css';
import '@ant-design/pro-form/dist/form.css';

import { Editor } from 'react-draft-wysiwyg';
import styled from 'styled-components';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import { convertToRaw, EditorState, ContentState } from 'draft-js';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

const { TextArea } = Input;

const MyBlock = styled.div`
  .wrapper-class{
      width: 100%;
      margin: 0 auto;
      margin-bottom: 0rem;
  }
  .editor {
    height: 500px !important;
    border: 1px solid #f1f1f1 !important;
    padding: 5px !important;
    border-radius: 2px !important;
  }
`;


const BoardModify = ({location}) => {

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

  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const onEditorStateChange = (editorState) => {
    // editorState에 값 설정
    setEditorState(editorState);
  };

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

        const htmlToEditor = `${board.content}`;
        
        const blocksFromHtml = htmlToDraft(htmlToEditor);
        if (blocksFromHtml) {
          const { contentBlocks, entityMap } = blocksFromHtml;
          // https://draftjs.org/docs/api-reference-content-state/#createfromblockarray
          const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
          // ContentState를 EditorState기반으로 새 개체를 반환.
          // https://draftjs.org/docs/api-reference-editor-state/#createwithcontent
          const editorState = EditorState.createWithContent(contentState);
          setEditorState(editorState);
        }

        setLoading(false);
      } else {
          setLoading(false);
          alert(response.data.error)
      }

    });
  };

  const onFinish = async (values) => {
    console.log(values)

    console.log(editorState.getCurrentContent());
    console.log(draftToHtml(convertToRaw(editorState.getCurrentContent())));

    setLoading(true);

    // DB-SAVE
    let body = {
      user: _id,
      boardId: boardId,
      // boardType: boardType,
      title: form.getFieldValue("title"),
      // content: form.getFieldValue("content"),
      content: draftToHtml(convertToRaw(editorState.getCurrentContent()))
    }
    console.log(body)
    const res = await axios.post('/api/board/modify', body)

    setLoading(false);

    window.history.back();
    // navigate('/boardList', { state: {boardType:boardType, boardName:boardName}}); 

  }

  const [uploadedImages, setUploadedImages] = useState([]);

  function uploadImageCallBack(file){
    // long story short, every time we upload an image, we
    // need to save it to the state so we can get it's data
    // later when we decide what to do with it.
    
    const imageObject = {
      file: file,
      localSrc: URL.createObjectURL(file),
    }

    setUploadedImages([...uploadedImages, imageObject])

    
    // We need to return a promise with the image src
    // the img src we will use here will be what's needed
    // to preview it in the browser. This will be different than what
    // we will see in the index.md file we generate.
    return new Promise(
      (resolve, reject) => {
        resolve({ data: { link: imageObject.localSrc } });
      }
    );
  }

  useEffect(() => {

    fetch({
      boardId: boardId  
    });

  }, []);

  useEffect(() => {

    console.log("ABC")
    console.log("editorState.hasText:"+editorState.getCurrentContent().hasText())

    if (form.getFieldValue("title") && editorState.getCurrentContent().hasText()) {
      setDisableNext(false)
    } else {
      setDisableNext(true)
    }
    
  }, [editorState]);

  return (
    <div>
    <PageContainer
        ghost
        header={{
          title: formatMessage({id: boardName}),
          ghost: false,
          extra: [   
          <Button key="1" onClick={() => window.history.back()}>
            {formatMessage({id: 'Back'})}
          </Button>,
          <Button key="2" onClick={() => form.resetFields()}>{formatMessage({id: 'Initialize'})}</Button>,        
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
          if (form.getFieldValue("title") && editorState.getCurrentContent().hasText()) {
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

      <MyBlock>
        <Editor
          // 에디터와 툴바 모두에 적용되는 클래스
          wrapperClassName="wrapper-class"
          // 에디터 주변에 적용된 클래스
          editorClassName="editor"
          // 툴바 주위에 적용된 클래스
          toolbarClassName="toolbar-class"
          // 툴바 설정
          toolbar={{
            // inDropdown: 해당 항목과 관련된 항목을 드롭다운으로 나타낼것인지
            list: { inDropdown: true },
            textAlign: { inDropdown: true },
            link: { inDropdown: true },
            history: { inDropdown: false },
            // 이미지, 한글과 동시에 입력시 버그 있음 
            // image: {
            //   uploadCallback: uploadImageCallBack,
            //   previewImage: true,
            //   alt: { present: true, mandatory: false },
            //   inputAccept: 'image/gif,image/jpeg,image/jpg,image/png,image/svg',
            // }
          }} 
          placeholder="내용을 작성해주세요."
          // 한국어 설정
          localization={{
            locale: 'ko',
          }}
          // 초기값 설정
          editorState={editorState}
          // 에디터의 값이 변경될 때마다 onEditorStateChange 호출
          onEditorStateChange={onEditorStateChange}
        />
      </MyBlock>

      </ProForm>

    </ProCard>  
      
      

    </PageContainer>
    </div>
    
  );
};

export default BoardModify;
