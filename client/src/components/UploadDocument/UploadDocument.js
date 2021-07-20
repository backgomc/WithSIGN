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
import { PageContainer } from '@ant-design/pro-layout';
import ProCard from '@ant-design/pro-card';
import ProForm, { ProFormUploadDragger, ProFormText } from '@ant-design/pro-form';
import '@ant-design/pro-card/dist/card.css';
import 'antd/dist/antd.css';
import '@ant-design/pro-form/dist/form.css';

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
  const [form] = Form.useForm();
  // const formRef = React.createRef();

  const [instance, setInstance] = useState(null);
  const [file, setFile] = useState(null);
  const [hiddenFileUpload, setHiddenFileUpload] = useState(false);
  const [hiddenForm, setHiddenForm] = useState(true);
  const [disableNext, setDisableNext] = useState(true);

  const user = useSelector(selectUser);
  const { email, _id } = user;

  const documentTitle = useSelector(selectDocumentTitle);

  useEffect(() => {

    // console.log("KK:"+formRef.current.getFieldValue('documentTitle'))

    // if (formRef.current.getFieldValue('documentTitle')) {
    //   setDisableNext(false)
    // } else {
    //   setDisableNext(true)
    // }

    // formRef.current.setFieldsValue({
    //   documentTitle: 'Bamboo',
    // });

    // console.log("documentTitle:"+ documentTitle)
    
    // if (documentTitle) {
      
    //   setHiddenForm(false);
    //   setDisableNext(false);
    //   formRef.current.setFieldsValue({
    //     documentTitle: documentTitle
    //   })
    // }

    // if (documentTitle) {
    //   setDisableNext(false)
    // } else {
    //   setDisableNext(true)
    // }


  }, []);


  const onFinish = (values) => {
    console.log(values)

    dispatch(setDocumentTitle(values.documentTitle));
    navigate('/assign')
  }

  // const props = {
  //   name: 'file',
  //   multiple: false,
  //   // action: '',
  //   beforeUpload: file => {

  //       console.log("beforeUpload called !!!")
  //       if (file.type !== 'application/pdf') {
  //           console.log(file.type)
  //           message.error(`${file.name} is not a pdf file`);
  //           return Upload.LIST_IGNORE;
  //       }
  //       setFile(file);
        
  //       console.log("form:"+form)

  //       formRef.current.setFieldsValue({
  //         documentTitle: file.name.replace(/\.[^/.]+$/, ""),
  //       })

  //       dispatch(setDocumentFile(file));
  //       setHiddenForm(false);
  //       setHiddenFileUpload(true);

  //       return false;
  //   },
  //   onChange(info) {
  //       console.log(info.file, info.fileList);

  //       formRef.current.setFieldsValue({
  //         documentTitle: info.file.name.replace(/\.[^/.]+$/, ""),
  //       })
  //   },
  //   onDrop(e) {
  //     console.log('Dropped files', e.dataTransfer.files);
  //   },
  // };

  return (
    <div
    style={{
      // background: '#F5F7FA',
      // background: '#FFFFFF',
    }}
    >
    
      <PageContainer
      ghost
      header={{
        title: '',
        ghost: true,
        breadcrumb: {
          routes: [
            {
              path: '/',
              breadcrumbName: '서명 요청',
            },
            {
              path: '/',
              breadcrumbName: '문서 등록',
            },
          ],
        },
        extra: [
        ],
      }}
      footer={[
        <Button key="3" onClick={() => form.resetFields()}>초기화</Button>,
        <Button key="2" type="primary" onClick={() => form.submit()} disabled={disableNext}>
          {formatMessage({id: 'Next'})}
        </Button>,
      ]}
    >
      <ProCard direction="column" ghost gutter={[0, 16]}>

        <ProCard style={{ background: '#FFFFFF'}} layout="center"><StepWrite current={0} /></ProCard>
        <ProCard
          tabs={{
            type: 'card',
          }}
        >
          <ProCard.TabPane key="tab1" tab="내 컴퓨터">
            {/* <Space direction="vertical"> */}
              {/* ISSUE: 파일 업로드 후 히든이 안됨 */}
              {/* <Dragger {...props} hidden={hiddenFileUpload} max={1}>  
                  <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">
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
              </Dragger> */}

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
                console.log(form.getFieldValue("dragger"))
                console.log(form.getFieldValue("documentTitle"))
                if (form.getFieldValue("dragger") && form.getFieldValue("documentTitle").length > 0) {
                  setDisableNext(false)
                  console.log("AA")
                } else {
                  setDisableNext(true)
                  console.log("BB")
                }
              }}
            >
              <ProFormUploadDragger 
                // {...props} 
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
                    console.log("AAAAA")
                    if (file.type !== 'application/pdf') {
                      console.log(file.type)
                      message.error(`${file.name} is not a pdf file`);
                      return Upload.LIST_IGNORE;
                    }
                    setFile(file);
                    
                    form.setFieldsValue({
                      documentTitle: file.name.replace(/\.[^/.]+$/, ""),
                    })
            
                    dispatch(setDocumentFile(file));
            
                    return false;
                  }
                }}
              >
              </ProFormUploadDragger>

              <ProFormText
                name="documentTitle"
                label="문서명"
                // width="md"
                tooltip="입력하신 문서명으로 상대방에게 표시됩니다."
                placeholder="문서명을 입력하세요."
                rules={[{ required: true, message: formatMessage({id: 'input.documentTitle'}) }]}
              />

            </ProForm>

              {/* <Form 
                form={form}
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

              </Form> */}

          </ProCard.TabPane>
          <ProCard.TabPane key="tab2" tab="템플릿">
            템플릿 선택 
          </ProCard.TabPane>
        </ProCard>
      </ProCard>
    </PageContainer>
  </div>

      // <div>
      //   <StepWrite current={0} />
      //   <br></br>
        // <Tabs defaultActiveKey="1" type="card" size="small">
            
        // <TabPane tab="내 컴퓨터" key="1">
        //     <Space direction="vertical">
        //       {/* ISSUE: 파일 업로드 후 히든이 안됨 */}
        //       <Dragger {...props} hidden={hiddenFileUpload}>  
        //           <p className="ant-upload-drag-icon">
        //           <InboxOutlined />
        //           </p>
        //           <p className="ant-upload-text" style={{minWidth: "650px"}}>
        //             {formatMessage({id: 'input.fileupload'})}
        //           </p>
        //           <p className="ant-upload-hint">
        //             <CheckOutlined /> &nbsp;
        //             {formatMessage({id: 'input.fileupload.support'})}
        //           </p>
        //           <p className="ant-upload-hint">
        //             <CheckOutlined /> &nbsp;
        //             {formatMessage({id: 'input.fileupload.volume'})}
        //           </p>
        //       </Dragger>

        //       <Form 
        //         name="form"
        //         hidden={hiddenForm}
        //         labelCol={{
        //           span: 0,
        //         }}
        //         wrapperCol={{
        //           span: 22,
        //         }}
        //         ref={formRef}
        //         className="login-form"
        //         initialValues={{
        //             // documentTitle: "",
        //         }}
        //         onFinish={onFinish}
        //         >
        //           <Form.Item
        //               name="documentTitle"
        //               label="문서 제목"
        //               rules={[
        //               {
        //                   required: true,
        //                   message: formatMessage({id: 'input.documentTitle'}),
        //               },
        //               ]}
        //           >
        //               <Input />
        //           </Form.Item>
        //           <Form.Item {...tailLayout}>
        //               <Button type="primary" htmlType="submit">
        //                   {formatMessage({id: 'Next'})}
        //               </Button>
        //           </Form.Item>

        //       </Form>

        //     </Space>
        //   </TabPane>
        //   <TabPane tab="회사 템플릿" key="2">
        //     Content of card tab 2
        //   </TabPane>
        //   <TabPane tab="내 템플릿" key="3">
        //     Content of card tab 3
        //   </TabPane>
        // </Tabs>
      // </div>
  )

};

export default UploadDocument;
