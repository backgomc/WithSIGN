import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { navigate } from '@reach/router';
import { selectUser } from '../../app/infoSlice';
import 'antd/dist/antd.css';
import { Tabs, Upload, message, Input, Space, Form, Button } from 'antd';
import { InboxOutlined, CheckOutlined } from '@ant-design/icons';
import StepWrite from '../Step/StepWrite';
import { useIntl } from "react-intl";
import { setDocumentFile, setDocumentTitle, selectDocumentTitle } from '../Assign/AssignSlice';

const { TabPane } = Tabs;
const { Dragger } = Upload;
const tailLayout = {
  wrapperCol: {
    offset: 22,
    span: 16,
  },
};

const UploadDocument = () => {

  const dispatch = useDispatch();
  const { formatMessage } = useIntl();

  const [instance, setInstance] = useState(null);
  const [file, setFile] = useState(null);
  const [hiddenFileUpload, setHiddenFileUpload] = useState(false);
  const [hiddenForm, setHiddenForm] = useState(true);

  const user = useSelector(selectUser);
  const { email, _id } = user;

  const documentTitle = useSelector(selectDocumentTitle);

  const [form] = Form.useForm();
  const formRef = React.createRef();

  useEffect(() => {

    // formRef.current.setFieldsValue({
    //   documentTitle: 'Bamboo',
    // });
    
    if (documentTitle) {
      setHiddenForm(false);
      formRef.current.setFieldsValue({
        documentTitle: documentTitle
      })
    }


  }, [formRef, documentTitle]);


  const onFinish = (values) => {
    console.log(values)

    dispatch(setDocumentTitle(values.documentTitle));
    navigate('/assign')

    // let body = {
    //     documentTitle: values.documentTitle
    // }

    // navigate('/');
    // dispatch(setUser(response.data.user));
}

  const props = {
    name: 'file',
    multiple: false,
    // action: '',
    beforeUpload: file => {
        if (file.type !== 'application/pdf') {
            console.log(file.type)
            message.error(`${file.name} is not a pdf file`);
            return Upload.LIST_IGNORE;
        }
        setFile(file);
        
        console.log("form:"+form)

        formRef.current.setFieldsValue({
          documentTitle: file.name.replace(/\.[^/.]+$/, ""),
        })

        dispatch(setDocumentFile(file));
        setHiddenForm(false);
        setHiddenFileUpload(true);

        return false;
    },
    onChange(info) {
        console.log(info.file, info.fileList);
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
    },
  };

  return (
      <div>
        <p style={{width: "650px"}}><StepWrite current={0} /></p>
        <br></br>
        <Tabs defaultActiveKey="1" type="card" size="small">
            
        <TabPane tab="내 컴퓨터" key="1">
            <Space direction="vertical">
              {/* ISSUE: 파일 업로드 후 히든이 안됨 */}
              <Dragger {...props} hidden={hiddenFileUpload}>  
                  <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                  </p>
                  <p className="ant-upload-text" style={{minWidth: "650px"}}>
                    {formatMessage({id: 'input.fileupload'})}
                  </p>
                  <p className="ant-upload-hint">
                    <CheckOutlined /> &nbsp;
                    {formatMessage({id: 'input.fileupload.support'})}
                  </p>
                  <p className="ant-upload-hint">
                    <CheckOutlined /> &nbsp;
                    {formatMessage({id: 'input.fileupload.volume'})}
                  </p>
              </Dragger>

              <Form 
                name="form"
                hidden={hiddenForm}
                labelCol={{
                  span: 0,
                }}
                wrapperCol={{
                  span: 22,
                }}
                ref={formRef}
                className="login-form"
                initialValues={{
                    // documentTitle: "",
                }}
                onFinish={onFinish}
                >
                  <Form.Item
                      name="documentTitle"
                      label="문서 제목"
                      rules={[
                      {
                          required: true,
                          message: formatMessage({id: 'input.documentTitle'}),
                      },
                      ]}
                  >
                      <Input />
                  </Form.Item>
                  <Form.Item {...tailLayout}>
                      <Button type="primary" htmlType="submit">
                          {formatMessage({id: 'Next'})}
                      </Button>
                  </Form.Item>

              </Form>

            </Space>
          </TabPane>
          <TabPane tab="회사 템플릿" key="2">
            Content of card tab 2
          </TabPane>
          <TabPane tab="내 템플릿" key="3">
            Content of card tab 3
          </TabPane>
        </Tabs>
      </div>
  )

};

export default UploadDocument;
