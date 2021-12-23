import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Table, Input, Space, Button, Form, message, Upload } from "antd";
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
import * as common from "../../util/common";

import ProCard from '@ant-design/pro-card';
import ProForm, { ProFormUploadDragger, ProFormText, ProFormTextArea } from '@ant-design/pro-form';

import '@ant-design/pro-card/dist/card.css';
import 'antd/dist/antd.css';
import '@ant-design/pro-form/dist/form.css';

// import { Editor } from 'react-draft-wysiwyg';
// import styled from 'styled-components';
// import draftToHtml from 'draftjs-to-html';
// import { convertToRaw, EditorState } from 'draft-js';
// import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

// TOAST UI Editor import
import 'codemirror/lib/codemirror.css';
import '@toast-ui/editor/dist/toastui-editor.css';
import { Editor } from '@toast-ui/react-editor';

// TOAST UI Editor Plugins
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';

// color-syntax
import 'tui-color-picker/dist/tui-color-picker.css';
import '@toast-ui/editor-plugin-color-syntax/dist/toastui-editor-plugin-color-syntax.css';
import colorSyntax from '@toast-ui/editor-plugin-color-syntax';

// code-syntax
import '@toast-ui/editor-plugin-code-syntax-highlight/dist/toastui-editor-plugin-code-syntax-highlight.css';
// import codeSyntaxHighlight from '@toast-ui/editor-plugin-code-syntax-highlight';
import codeSyntaxHighlight from '@toast-ui/editor-plugin-code-syntax-highlight/dist/toastui-editor-plugin-code-syntax-highlight-all.js';


const { TextArea } = Input;

// const MyBlock = styled.div`
//   .wrapper-class{
//       width: 100%;
//       margin: 0 auto;
//       margin-bottom: 0rem;
//   }
//   .editor {
//     height: 500px !important;
//     border: 1px solid #f1f1f1 !important;
//     padding: 5px !important;
//     border-radius: 2px !important;
//   }
// `;


const BoardWrite = ({location}) => {

  const editorRef = useRef();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { _id } = user;
  const boardType = location.state?.boardType ? location.state.boardType : "qna";
  const boardName = location.state?.boardName ? location.state.boardName : "게시글 작성";

  const [form] = Form.useForm();

  const [disableNext, setDisableNext] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [data, setData] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [hasSelected, setHasSelected] = useState(selectedRowKeys.length > 0);
  const [fileList, setFileList] = useState([]);

  
  const [pagination, setPagination] = useState({current:1, pageSize:10});
  const [loading, setLoading] = useState(false);


  const { formatMessage } = useIntl();
  const searchInput = useRef<Input>(null)

  // const [editorState, setEditorState] = useState(EditorState.createEmpty());
  // const onEditorStateChange = (editorState) => {
  //   // editorState에 값 설정
  //   setEditorState(editorState);
  // };

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

    setLoading(true);
    
    // FILE UPLOAD
    const filePaths = []
    var files = []
    console.log('fileList:'+fileList)
    if (fileList.length > 0) {

      const formData = new FormData()

      formData.append('path', 'articles/'+Date.now()+'/');
      fileList.forEach(file => formData.append('files', file));

      const resFile = await axios.post(`/api/storage/uploadFiles`, formData)
      if (resFile.data.success) {
        resFile.data.files.map(file => {
          filePaths.push(file.path)
        })

        files = resFile.data.files
      }
    }

    console.log('filePaths:'+filePaths)
    
    
    // console.log(editorState.getCurrentContent());
    // console.log(draftToHtml(convertToRaw(editorState.getCurrentContent())));

    const editorInstance = editorRef.current.getInstance();
    const contentHtml = editorInstance.getHtml();
    console.log('contentHtml:'+contentHtml)

    // DB-SAVE
    let body = {
      user: _id,
      boardType: boardType,
      title: form.getFieldValue("title"),
      content: contentHtml,
      files: files
      // content: draftToHtml(convertToRaw(editorState.getCurrentContent()))
    }
    console.log(body)
    const res = await axios.post('/api/board/add', body)

    setLoading(false);
    navigate('/boardList', { state: {boardType:boardType, boardName:boardName}}); 

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

  // useEffect(() => {

  //   console.log("ABC")
  //   // console.log("editorState.hasText:"+editorState.getCurrentContent().hasText())

  //   // if (form.getFieldValue("title") && editorState.getCurrentContent().hasText()) {
  //   if (form.getFieldValue("title")) {
  //     setDisableNext(false)
  //   } else {
  //     setDisableNext(true)
  //   }
    
  // }, []);

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

      {/* <MyBlock>
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
      </MyBlock> */}

      <Editor
          initialValue=""
          usageStatistics={false}
          ref={editorRef}
          height="46vh"
          initialEditType="wysiwyg" // wysiwyg | markdown
          onChange={onChangeTextHandler}
          // plugins={[colorSyntax]}
          // plugins={[chart, codeSyntaxHighlight, colorSyntax, tableMergedCell, uml]}
      />

      <br></br>
      <ProFormUploadDragger 
        max={3} 
        label="" 
        name="dragger" 
        // title={formatMessage({id: 'input.fileupload.file'})}
        title={""}
        description={formatMessage({id: 'input.fileupload.file.volume'}) +', '+ formatMessage({id: 'input.fileupload.file.max'})}
        // description={""}
        fieldProps={{
          height: '120px',
          onChange: (info) => {
            if (info.fileList.length != fileList.length) { // 파일 삭제 된 것으로 판단
              setFileList(fileList.filter(e => e.uid != info.file.uid)) // fileList(State Object)에 파일 삭제
            }
          },
          beforeUpload: file => {
            // if (file.type !== 'application/pdf') {
            //   console.log(file.type)
            //   message.error(`${file.name} is not a pdf file`);
            //   return Upload.LIST_IGNORE;
            // }

            if (file.size > 1048576 * 10) {  //5MB
              console.log(file.size)
              message.error(`filesize(${common.formatBytes(file.size)}) is bigger than 10MB`);
              return Upload.LIST_IGNORE;
            }

            // fileList(State Object)에 파일 추가
            setFileList(fileList.concat(file));
                          
            return false;
          }
        }}
      >
      </ProFormUploadDragger>

    </ProForm>
  </ProCard>  
      
      

  </PageContainer>
  </div>
    
  );
};

export default BoardWrite;
