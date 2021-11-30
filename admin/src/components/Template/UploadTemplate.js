import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { navigate } from '@reach/router';
import { selectUser } from '../../app/infoSlice';
import 'antd/dist/antd.css';
import { Upload, message, Form, Button } from 'antd';
import { useIntl } from 'react-intl';
import { PageContainer } from '@ant-design/pro-layout';
import ProCard from '@ant-design/pro-card';
import ProForm, { ProFormUploadDragger, ProFormText } from '@ant-design/pro-form';
import '@ant-design/pro-card/dist/card.css';
import 'antd/dist/antd.css';
import '@ant-design/pro-form/dist/form.css';

const UploadTemplate = () => {

  const { formatMessage } = useIntl();
  const [form] = Form.useForm();

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [disableNext, setDisableNext] = useState(true);

  const user = useSelector(selectUser);
  const { _id } = user;

  useEffect(() => {}, []);

  const onFinish = async (values) => {

    setLoading(true);
    
    // 템플릿 업로드 
    // 1. FILE-SAVE
    const referenceString = `template/${_id}${Date.now()}.pdf`;
    const formData = new FormData();
    formData.append('path', 'templates');
    formData.append('file', file, referenceString);
    await axios.post('/api/storage/upload', formData);

    // 2. DB-SAVE
    let body = {
      user: _id,
      docTitle: form.getFieldValue('documentTitle'),
      type: 'C',
      docRef: referenceString
    }
    await axios.post('/api/admin/templates/insert', body);

    setLoading(false);
    navigate('/templateList');
  }

  return (
    <div
    style={{
      // background: '#F5F7FA',
      // background: '#FFFFFF',
    }}
    >
      <PageContainer
      loading={loading}
      ghost
      header={{
        title: '템플릿 등록',
        ghost: false,
        breadcrumb: {
          routes: [

          ],
        },
        extra: [
          <Button key='1' onClick={() => {navigate('/templateList');}}>이전</Button>,
          <Button key='2' onClick={() => form.resetFields()}>{formatMessage({id: 'Initialize'})}</Button>,
          <Button key='3' type='primary' onClick={() => form.submit()} disabled={disableNext}>
            {formatMessage({id: 'Save'})}
          </Button>,
        ],
      }}
      footer={[
        // <Button key='3' onClick={() => form.resetFields()}>{formatMessage({id: 'Initialize'})}</Button>,
        // <Button key='2' type='primary' onClick={() => form.submit()} disabled={disableNext}>
        //   {formatMessage({id: 'Save'})}
        // </Button>,
      ]}
    >
      <br></br>
      <ProCard direction='column' ghost gutter={[0, 16]}>
        <ProCard
          tabs={{
            type: 'card',
          }}
        >
          <ProCard.TabPane key='tab1' tab='내 컴퓨터'>
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
                console.log('onValuesChange called');
                console.log(form.getFieldValue('dragger'));
                console.log(form.getFieldValue('documentTitle'));
                if (form.getFieldValue('dragger') && form.getFieldValue('documentTitle').length > 0) {
                  setDisableNext(false);
                } else {
                  setDisableNext(true);
                }
              }}
            >
              <ProFormUploadDragger 
                max={1} 
                label='' 
                name='dragger' 
                title={formatMessage({id: 'input.fileupload'})}
                description={formatMessage({id: 'input.fileupload.support'})+', '+formatMessage({id: 'input.fileupload.volume'})}
                fieldProps={{
                  onChange: (info) => {
                    console.log(info.file, info.fileList);
                    if (info.fileList.length === 0) {
                      form.setFieldsValue({
                        documentTitle: '',
                      });
                      setDisableNext(true);
                    }
                  },
                  beforeUpload: file => {
                    if (file.type !== 'application/pdf') {
                      console.log(file.type);
                      message.error(`${file.name} is not a pdf file`);
                      return Upload.LIST_IGNORE;
                    }
                    setFile(file);
                    
                    form.setFieldsValue({
                      documentTitle: file.name.replace(/\.[^/.]+$/, ''),
                    });
                        
                    return false;
                  }
                }}
              >
              </ProFormUploadDragger>

              <ProFormText
                name='documentTitle'
                label='템플릿명'
                // width='md'
                tooltip='입력하신 템플릿명으로 표시됩니다.'
                placeholder='템플릿명을 입력하세요.'
                rules={[{ required: true, message: formatMessage({id: 'input.documentTitle'}) }]}
              />

            </ProForm>

          </ProCard.TabPane>
        </ProCard>
      </ProCard>
    </PageContainer>
  </div>
  )

};

export default UploadTemplate;
