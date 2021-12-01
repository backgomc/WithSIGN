import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { navigate } from '@reach/router';
import { selectUser } from '../../app/infoSlice';
import 'antd/dist/antd.css';
import { Upload, message, Form, Button, Result, Alert } from 'antd';
import { useIntl } from "react-intl";
import { PageContainer } from '@ant-design/pro-layout';
import ProCard from '@ant-design/pro-card';
import ProForm, { ProFormUploadDragger } from '@ant-design/pro-form';
import '@ant-design/pro-card/dist/card.css';
import 'antd/dist/antd.css';
import '@ant-design/pro-form/dist/form.css';

const AuditCheck = () => {

  const { formatMessage } = useIntl();
  const [form] = Form.useForm();

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [disableNext, setDisableNext] = useState(true);

  const [resultDisplay, setResultDisplay] = useState('none');
  const [resultStatus, setResultStatus] = useState('success');
  const [resultTitle, setResultTitle] = useState('');
  const [resultSubTitle, setResultSubTitle] = useState('');

  const user = useSelector(selectUser);
  const { email, _id } = user;

  useEffect(() => {
  }, []);


  const onFinish = async (values) => {
    console.log(values)

    setLoading(true);
    // 문서 업로드 
    const formData = new FormData()
    formData.append('file', file)
    const res = await axios.post(`/api/storage/checkHashByFile`, formData)
    console.log(res)

    if (res.data.isReal) {
      setResultDisplay('')
      setResultTitle('해당 문서는 진본입니다.')
      setResultSubTitle('Hash: '+res.data.hash)
      setResultStatus('success')
    } else {
      setResultDisplay('')
      setResultTitle('해당 문서는 진본이 아닙니다.')
      setResultSubTitle('Hash: '+res.data.hash)
      setResultStatus('error')
    }

    setLoading(false);
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
        title: '문서 진본 확인',
        ghost: false,
        breadcrumb: {
          routes: [
            // {
            //   path: '/',
            //   breadcrumbName: '템플릿',
            // },
            // {
            //   path: '/',
            //   breadcrumbName: '템플릿 등록',
            // },
          ],
        },
        extra: [
          <Button onClick={() => window.history.back()}>
            {formatMessage({id: 'Back'})}
          </Button>,
          <Button key="2" onClick={() => {form.resetFields();setResultDisplay('none');setDisableNext(true);}}>{formatMessage({id: 'Initialize'})}</Button>,
          <Button key="3" type="primary" onClick={() => form.submit()} disabled={disableNext}>
            {formatMessage({id: 'document.check'})}
          </Button>,
        ],
      }}
      content={'문서를 업로드하여 해당 문서의 진본 여부를 확인 할 수 있습니다.'}
      footer={[
        // <Button key="3" onClick={() => form.resetFields()}>{formatMessage({id: 'Initialize'})}</Button>,
        // <Button key="2" type="primary" onClick={() => form.submit()} disabled={disableNext}>
        //   {formatMessage({id: 'Save'})}
        // </Button>,
      ]}
    >
      <br></br>
      <ProCard direction="column" ghost gutter={[0, 16]}>

        <ProCard
          tabs={{
            type: 'card',
          }}
        >
          <ProCard.TabPane key="tab1" tab="내 컴퓨터">
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
                if (form.getFieldValue("dragger")) {
                  setDisableNext(false)
                } else {
                  setDisableNext(true)
                  setResultDisplay('none')
                }
              }}
            >
              <ProFormUploadDragger 
                max={1} 
                label="" 
                name="dragger" 
                title={formatMessage({id: 'input.fileupload'})}
                description={formatMessage({id: 'input.fileupload.support'})+", "+formatMessage({id: 'input.fileupload.volume'})}
                fieldProps={{
                  onChange: (info) => {
                    console.log(info.file, info.fileList);
                    if (info.fileList.length == 0) {
                      form.setFieldsValue({
                        documentTitle: "",
                      })
                      setDisableNext(true)
                    }
                  },
                  beforeUpload: file => {
                    if (file.type !== 'application/pdf') {
                      console.log(file.type)
                      message.error(`${file.name} is not a pdf file`);
                      return Upload.LIST_IGNORE;
                    }
                    setFile(file);
                    
                    form.setFieldsValue({
                      documentTitle: file.name.replace(/\.[^/.]+$/, ""),
                    })
                        
                    return false;
                  }
                }}
              >
              </ProFormUploadDragger>

              <div style={{display:resultDisplay}}>
                <Result
                  status={resultStatus}
                  title={resultTitle}
                  subTitle={resultSubTitle}
                  // extra={[
                  //   <Button type="primary" key="console">
                  //     Go Console
                  //   </Button>,
                  //   <Button key="buy">Buy Again</Button>,
                  // ]}
                />
              </div>

            </ProForm>

          </ProCard.TabPane>
        </ProCard>
      </ProCard>
    </PageContainer>
  </div>
  )

};

export default AuditCheck;
