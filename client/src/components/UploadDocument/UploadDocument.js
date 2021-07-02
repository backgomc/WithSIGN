import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { navigate } from '@reach/router';
import { selectUser } from '../../app/infoSlice';
import 'antd/dist/antd.css';
import { Tabs, Upload, message, Input, Space, Form, Button } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import StepWrite from '../Step/StepWrite';
import { useIntl } from "react-intl";

const { TabPane } = Tabs;
const { Dragger } = Upload;

const UploadDocument = () => {

  const dispatch = useDispatch();
  const { formatMessage } = useIntl();

  const [instance, setInstance] = useState(null);
  const [file, setFile] = useState(null);

  const user = useSelector(selectUser);
  const { email, _id } = user;

  const { frm } = Form.useForm();

  useEffect(() => {

  }, [_id]);


  const onFinish = (values) => {
    console.log(values)

    let body = {
        documentTitle: values.documentTitle
    }

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
        
        frm.documentTitle = "asasass"
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
        <StepWrite current={0} />
        
        <br></br>
        <Tabs defaultActiveKey="1" type="card" size="small">
            
        <TabPane tab="내 컴퓨터" key="1">
            <Space direction="vertical">

                <Form
                name="frm"
                className="login-form"
                initialValues={{
                    // documentTitle: "ㅁㅁㅁㅁ",
                }}
                onFinish={onFinish}
                >
                    <Form.Item
                        name="documentTitle"
                        rules={[
                        {
                            required: true,
                            message: formatMessage({id: 'input.documentTitle'}),
                        },
                        ]}
                    >
                        <Input prefix="(문서 제목)" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            {formatMessage({id: 'Next'})}
                        </Button>
                    </Form.Item>
                </Form>
                
                <Dragger {...props}>
                    <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">Click or drag file to this area to upload</p>
                    <p className="ant-upload-hint">
                    Support for a single or bulk upload. Strictly prohibit from uploading company data or other
                    band files
                    </p>
                </Dragger>
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
