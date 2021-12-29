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

const BoardWrite = () => {

  const editorRef = useRef();
  const user = useSelector(selectUser);
  const { _id } = user;
  const [form] = Form.useForm();
  const [disableNext, setDisableNext] = useState(true);
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading]= useState(false);
  const { formatMessage } = useIntl();

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
    if (fileList.length > 0) {
      let formData = new FormData();
      formData.append('path', 'articles/'+Date.now()+'/');
      fileList.forEach(file => formData.append('files', file));
      let resFile = await axiosInterceptor.post('/admin/board/attach', formData);
      if (resFile.data.success) {
        console.log(resFile.data.files);
        filePaths.push(resFile.data.files.map(file => {
          return file.path;
        }));
        files = resFile.data.files;
      }
    }

    console.log('filePaths:'+filePaths);
    
    let editorInstance = editorRef.current.getInstance();
    let contentHtml = editorInstance.getHtml();
    
    // DB-SAVE
    let body = {
      user: _id,
      boardType: form.getFieldValue('boardType'),
      title: form.getFieldValue('title'),
      content: contentHtml,
      files: files
    }
    console.log(body);
    await axiosInterceptor.post('/admin/board/insert', body);

    setLoading(false);
    navigate('/boardList');
  }

  useEffect(() => {
    return () => setLoading(false);
  }, []);

  return (
    <div>
      <PageContainer
        ghost
        header={{
          title: formatMessage({id: 'board.insert'}),
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
          ]
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
              initialValue={'notice'}
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
              description={formatMessage({id: 'input.fileupload.file.volume'}) + ', ' + formatMessage({id: 'input.fileupload.file.max'})}
              fieldProps={{
                onChange: (info) => {
                  if (info.fileList.length !== fileList.length) { // 파일 삭제 된 것으로 판단
                    setFileList(fileList.filter(e => e.uid !== info.file.uid)) // fileList(State Object)에 파일 삭제
                  }
                },
                beforeUpload: file => {
                  if (file.size > 1048576 * 10) {  //5MB
                    console.log(file.size);
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
