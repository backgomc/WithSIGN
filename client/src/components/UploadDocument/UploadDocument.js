import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { navigate } from '@reach/router';
import { selectUser } from '../../app/infoSlice';
import 'antd/dist/antd.css';
import { Tabs, Upload, message, Input, Space, Form, Button } from 'antd';
// import { InboxOutlined, CheckOutlined } from '@ant-design/icons';
import StepWrite from '../Step/StepWrite';
import { useIntl } from "react-intl";
import { setDocumentFile, setDocumentTitle, selectDocumentTitle, selectDocumentFile, setTemplate, setDocumentType, selectDocumentType, selectTemplate, selectTemplateTitle, setTemplateTitle } from '../Assign/AssignSlice';
import { PageContainer } from '@ant-design/pro-layout';
import ProCard from '@ant-design/pro-card';
import ProForm, { ProFormUploadDragger, ProFormText } from '@ant-design/pro-form';
import TemplateList from '../Template/TemplateList';
import '@ant-design/pro-card/dist/card.css';
import 'antd/dist/antd.css';
import '@ant-design/pro-form/dist/form.css';
import SelectTemplate from '../Template/SelectTemplate';

const UploadDocument = () => {

  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const [form] = Form.useForm();
  // const formRef = React.createRef();
  const templateRef = useRef();

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
  const documentType = useSelector(selectDocumentType);
  const template = useSelector(selectTemplate);
  const templateTitle = useSelector(selectTemplateTitle);


  useEffect(() => {

    if (documentType === 'PC') {
      setTab("tab1")
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
    } else if (documentType === 'TEMPLATE') {
      setTab("tab2")
      if (templateTitle && template) {
        setDisableNext(false)
      } else {
        setDisableNext(true)
      }
    }

  }, [documentTitle, documentFile, documentType, templateTitle, templateRef]);


  const onFinish = (values) => {
    console.log(values)

    dispatch(setDocumentType('PC'))
    dispatch(setDocumentTitle(values.documentTitle))
    navigate('/assign')
  }

  const templateNext = () => {

    dispatch(setDocumentType('TEMPLATE'))
    dispatch(setTemplateTitle(templateTitle));
    navigate('/assign')
  }

  const templateChanged = (template) => {
    if(template) {
      console.log(template);
      if (template.docTitle.length > 0) {
        setDisableNext(false)
        dispatch(setTemplate(template));
        dispatch(setTemplateTitle(template.docTitle));
      }
    }
  }

  const templateTitleChanged = (title) => {
    dispatch(setTemplateTitle(title))
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
            activeKey: tab,
            onChange: (activeKey) => {
              console.log("activeKey:"+activeKey)
              setTab(activeKey)

              if (activeKey === "tab1") {
                dispatch(setDocumentType('PC'))
              } else {
                dispatch(setDocumentType('TEMPLATE'))
              }
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

              <SelectTemplate ref={templateRef} templateChanged={templateChanged} templateTitleChanged={templateTitleChanged} />

          </ProCard.TabPane>
        </ProCard>
      </ProCard>
    </PageContainer>
  </div>
  )

};

export default UploadDocument;
