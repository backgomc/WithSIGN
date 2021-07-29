import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { navigate } from '@reach/router';
import { selectUser } from '../../app/infoSlice';
import 'antd/dist/antd.css';
import { Tabs, Upload, message, Input, Space, Form, Button } from 'antd';
// import { InboxOutlined, CheckOutlined } from '@ant-design/icons';
import StepWrite from '../Step/StepWrite';
import { useIntl } from "react-intl";
import { setDocumentFile, setDocumentTitle, selectDocumentTitle, selectDocumentFile, setTemplate } from '../Assign/AssignSlice';
import { PageContainer } from '@ant-design/pro-layout';
import ProCard from '@ant-design/pro-card';
import ProForm, { ProFormUploadDragger, ProFormText } from '@ant-design/pro-form';
import TemplateList from '../Template/TemplateList';
import '@ant-design/pro-card/dist/card.css';
import 'antd/dist/antd.css';
import '@ant-design/pro-form/dist/form.css';
import TemplateSelect from '../Template/TemplateSelect';

// const { TabPane } = Tabs;
// const { Dragger } = Upload;
// const tailLayout = {
//   wrapperCol: {
//     offset: 22,
//     span: 16,
//   },
// };

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
  const [tab, setTab] = useState("tab1");

  const user = useSelector(selectUser);
  const { email, _id } = user;

  const documentTitle = useSelector(selectDocumentTitle);
  const documentFile = useSelector(selectDocumentFile);


  useEffect(() => {

    if (documentTitle) {
      form.setFieldsValue({
        documentTitle: documentTitle,
      })
    }

    if (documentFile) {
      form.setFieldsValue({
        dragger: [documentFile]
      })
    }

    if (documentTitle && documentFile) {
      setDisableNext(false)
    } else {
      setDisableNext(true)
    }

  }, [documentTitle, documentFile]);


  const onFinish = (values) => {
    console.log(values)

    dispatch(setDocumentTitle(values.documentTitle));
    navigate('/assign')
  }

  const templateNext = () => {
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

  const templateChanged = (template) => {
    if(template) {
      console.log(template);
      if (template.docTitle.length > 0) {
        setDisableNext(false)
        dispatch(setTemplate(template));
      }
    }
  }

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
        <Button key="2" type="primary" onClick={() => (tab === "tab1") ? form.submit() : templateNext()} disabled={disableNext}>
          {formatMessage({id: 'Next'})}
        </Button>,
      ]}
    >
      <ProCard direction="column" ghost gutter={[0, 16]}>

        <ProCard style={{ background: '#FFFFFF'}} layout="center"><StepWrite current={0} /></ProCard>
        <ProCard
          tabs={{
            type: 'card',
            onChange: (activeKey) => {
              console.log("activeKey:"+activeKey)
              setTab(activeKey)
            }
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

          </ProCard.TabPane>
          <ProCard.TabPane key="tab2" tab="템플릿">

              <TemplateSelect templateChanged={templateChanged} />

          </ProCard.TabPane>
        </ProCard>
      </ProCard>
    </PageContainer>
  </div>
  )

};

export default UploadDocument;
