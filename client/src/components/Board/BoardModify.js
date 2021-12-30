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

  const fileList = useRef([]);
  const fileListDeleted = useRef([]);

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

        var asisFileList = []

        board.files.map((file, index) => {
          const fileInfo = {
            uid: index,
            name: file.originalname,
            status: 'done',
            url: file.path,
            asis: true
          }
          asisFileList.push(fileInfo)
        })

        form.setFieldsValue({
          title: board.title,
          dragger: asisFileList
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
    console.log(fileListDeleted)

    setLoading(true);

    // FILE UPLOAD
    const filePaths = []
    var files = []
    console.log('fileList:'+fileList)
    if (fileList.current.length > 0) {

      const formData = new FormData()

      formData.append('path', 'articles/'+Date.now()+'/');
      fileList.current.forEach(file => formData.append('files', file));

      const resFile = await axios.post(`/api/storage/uploadFiles`, formData)
      if (resFile.data.success) {
        resFile.data.files.map(file => {
          filePaths.push(file.path)
        })

        // 신규 등록 파일 추가
        files = resFile.data.files
      }
    }

    console.log('filePaths:'+filePaths)

    // 기존 파일 추가 (삭제 항목 제외 후)
    board.files.map (file => {
      if (fileListDeleted.current.filter(deleteFile => deleteFile.url == file.path).length == 0) {
        files.push(file)
      }
    })

    console.log('최종 파일목록', files)


    const editorInstance = editorRef.current.getInstance();
    const contentHtml = editorInstance.getHtml();

    // DB-SAVE
    let body = {
      user: _id,
      boardId: boardId,
      // boardType: boardType,
      title: form.getFieldValue("title"),
      // content: form.getFieldValue("content"),
      content: contentHtml,
      files: files,
      filesDeleted: fileListDeleted.current
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
              
              console.log('dragger onchanged')
              console.log(info.file)
              console.log(info.fileList)

              if (info.file.asis && info.file.status == 'removed') {  // 기존 파일인경우 status 로 구분 가능
                fileListDeleted.current.push(info.file)

              } else { 
                // 신규 파일 첨부건 중에 삭제건 처리
                if (info.fileList.filter(e => !e.asis).length != fileList.current.length) {
                  fileList.current = fileList.current.filter(e => e.uid != info.file.uid)
                }

              }

              console.log('FILE LAST')
              console.log('fileList:', fileList)
              console.log('fileListDeleted:', fileListDeleted)
              
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

              fileList.current.push(file)
                            
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

export default BoardModify;
