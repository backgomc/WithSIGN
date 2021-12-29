import React, { useEffect, useState, useRef } from 'react';
import axiosInterceptor from '../../config/AxiosConfig';
import { v4 as uuidv4 } from 'uuid';
import { Button, Form, message, Upload } from 'antd';
import { useSelector } from 'react-redux';
import { selectUser } from '../../app/infoSlice';
import { navigate } from '@reach/router';
import 'moment/locale/ko';
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-layout';
import { useIntl } from 'react-intl';
import * as common from '../../util/common';
import ProCard from '@ant-design/pro-card';
import ProForm, { ProFormUploadDragger, ProFormText, ProFormSelect } from '@ant-design/pro-form';
import 'antd/dist/antd.css';
import '@ant-design/pro-form/dist/form.css';
import '@ant-design/pro-card/dist/card.css';
// TOAST UI Editor import
import 'codemirror/lib/codemirror.css';
import '@toast-ui/editor/dist/toastui-editor.css';
import { Editor } from '@toast-ui/react-editor';
// TOAST UI Editor Plugins
// import Prism from 'prismjs';
// import 'prismjs/themes/prism.css';
// color-syntax
// import 'tui-color-picker/dist/tui-color-picker.css';
// import '@toast-ui/editor-plugin-color-syntax/dist/toastui-editor-plugin-color-syntax.css';
// import colorSyntax from '@toast-ui/editor-plugin-color-syntax';
// code-syntax
// import '@toast-ui/editor-plugin-code-syntax-highlight/dist/toastui-editor-plugin-code-syntax-highlight.css';
// import codeSyntaxHighlight from '@toast-ui/editor-plugin-code-syntax-highlight';
// import codeSyntaxHighlight from '@toast-ui/editor-plugin-code-syntax-highlight/dist/toastui-editor-plugin-code-syntax-highlight-all.js';

const BoardModify = ({location}) => {

  const editorRef = useRef();
  const user = useSelector(selectUser);
  const { _id } = user;
  const [form] = Form.useForm();
  const [disableNext, setDisableNext] = useState(true);
  const fileList = useRef([]);
  const fileListDeleted = useRef([]);
  const [board, setBoard] = useState({title: '', content: '', requestedTime: '', user: {name: '', JOB_TITLE:''}});  
  const [loading, setLoading] = useState(false);
  const boardId = location.state?.boardId ? location.state.boardId : '';
  const boardType = location.state?.boardType ? location.state.boardType : '';
  const { formatMessage } = useIntl();

  const fetch = (params = {}) => {
    setLoading(true);

    axiosInterceptor.post('/admin/board/detail', params).then(response => {
      console.log(response);
      if (response.data.success) {
        let board = response.data.board;
        setBoard(board);

        var asisFileList = []

        board.files.forEach((file, idx) => {
          let fileInfo = {
            uid: idx,
            name: file.originalname,
            status: 'done',
            url: file.path,
            asis: true
          }
          asisFileList.push(fileInfo);
        });
        
        form.setFieldsValue({
          boardType: board.boardType,
          title: board.title,
          dragger: asisFileList
        });

        editorRef.current.getInstance().setHtml(board.content);

        setLoading(false);
      } else {
        alert(response.data.error);
        setLoading(false);
      }

    });
  };

  const onChangeTextHandler = () => {
    if (form.getFieldValue('title') && editorRef.current.getInstance().getHtml()) {
      setDisableNext(false);
    } else {
      setDisableNext(true);
    }
  }

  const onFinish = async (values) => {
    console.log(values);
    
    setLoading(true);

    // FILE UPLOAD
    let filePaths = []
    let files = []
    if (fileList.current.length > 0) {
      let formData = new FormData();
      formData.append('path', 'articles/'+Date.now()+'/');
      fileList.current.forEach(file => formData.append('files', file));
      let resFile = await axiosInterceptor.post('/admin/board/attach', formData);
      if (resFile.data.success) {
        console.log(resFile.data.files);
        filePaths.push(resFile.data.files.map(file => {
          return file.path;
        }));
        // 신규 등록 파일 추가
        files = resFile.data.files;
      }
    }

    console.log('filePaths:'+filePaths);
    
    // 기존 파일 추가 (삭제 항목 제외 후)
    board.files.forEach(file => {
      if (fileListDeleted.current.filter(deleteFile => deleteFile.url === file.path).length === 0) {
        files.push(file);
      }
    });

    console.log('최종 파일목록', files);

    let editorInstance = editorRef.current.getInstance();
    let contentHtml = editorInstance.getHtml();

    // DB-SAVE
    let body = {
      user: _id,
      boardId: boardId,
      title: form.getFieldValue('title'),
      content: contentHtml,
      files: files,
      filesDeleted: fileListDeleted.current
    }
    console.log(body);
    await axiosInterceptor.post('/admin/board/update', body);

    setLoading(false);
    navigate('/boardDetail', { state: { boardId: boardId, boardType: boardType } } ); 
  }

  useEffect(() => {
    fetch({
      boardId: boardId  
    });
    return () => setLoading(false);
  }, []);

  return (
    <div>
      <PageContainer
        ghost
        header={{
          title: formatMessage({id: 'board.update'}),
          ghost: false,
          extra: [   
            <Button key={uuidv4()} icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
              {/* {formatMessage({id: 'Back'})} */}
            </Button>,
            <Button key={uuidv4()} icon={<ReloadOutlined />} onClick={() => form.resetFields()}>
              {/* {formatMessage({id: 'Initialize'})} */}
            </Button>,        
            <Button key={uuidv4()} type="primary" disabled={disableNext} onClick={() => form.submit()}>
              {formatMessage({id: 'Save'})}
            </Button>
          ],
        }}
      >
        <br></br>
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
            onValuesChange={() => {
              if (form.getFieldValue('title') && editorRef.current.getInstance().getHtml()) {
                setDisableNext(false);
              } else {
                setDisableNext(true);
              }
            }}
          >
            <ProFormSelect
              name="boardType"
              valueEnum={{
                notice: '공지사항',
                faq: 'FAQ',
                opinion: '문의하기',
                manual: '매뉴얼'
              }}
              disabled
            />
            <ProFormText
              name="title"
              placeholder="제목을 입력하세요."
              rules={[{ required: true, message: formatMessage({id: 'input.boardTitle'}) }]}
            />
            <Editor
              initialValue=""
              usageStatistics={false}
              ref={editorRef}
              initialEditType="wysiwyg" // wysiwyg | markdown
              onChange={onChangeTextHandler}
              loading={loading}
            />
            <br></br>
            <ProFormUploadDragger 
              max={3} 
              name="dragger" 
              title={null}
              description={formatMessage({id: 'input.fileupload.file.volume'}) +', '+ formatMessage({id: 'input.fileupload.file.max'})}
              fieldProps={{
                onChange: (info) => {
                  if (info.file.asis && info.file.status === 'removed') { // 기존 파일인 경우 status 로 구분 가능
                    fileListDeleted.current.push(info.file);
                  } else { // 신규 파일인 경우 status 가 없어서 파일 수로 판단
                    // 신규 파일 첨부건 중에 삭제건 처리
                    if (info.fileList.filter(e => !e.asis).length !== fileList.current.length) {
                      fileList.current = fileList.current.filter(e => e.uid !== info.file.uid);
                    }
                  }
                },
                beforeUpload: file => {
                  if (file.size > 1048576 * 10) {  //5MB
                    console.log(file.size);
                    message.error(`filesize(${common.formatBytes(file.size)}) is bigger than 10MB`);
                    return Upload.LIST_IGNORE;
                  }
                  // fileList(State Object)에 파일 추가
                  fileList.current.push(file);
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
