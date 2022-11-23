import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { navigate } from '@reach/router';
import { selectUser } from '../../app/infoSlice';
import 'antd/dist/antd.css';
import { Tabs, Upload, message, Input, Space, Form, Button } from 'antd';
// import { InboxOutlined, CheckOutlined } from '@ant-design/icons';
import StepWrite from '../Step/StepWrite';
import { useIntl } from "react-intl";
import { setSignees, setObservers, setDocumentFile, setDocumentTitle, selectDocumentTitle, setDocumentTempPath, selectDocumentFile, setTemplate, setTemplateType, setDocumentType, selectDocumentType, selectTemplate, selectTemplateTitle, setTemplateTitle, selectSendType, selectTemplateType, resetTemplate, resetTemplateTitle, setAttachFiles, selectAttachFiles } from '../Assign/AssignSlice';
import { PageContainer } from '@ant-design/pro-layout';
import ProCard from '@ant-design/pro-card';
import ProForm, { ProFormUploadDragger, ProFormText, ProFormUploadButton } from '@ant-design/pro-form';
import TemplateList from '../Template/TemplateList';
import '@ant-design/pro-card/dist/card.css';
import 'antd/dist/antd.css';
import '@ant-design/pro-form/dist/form.css';
import SelectTemplate from '../Template/SelectTemplate';
import * as common from "../../util/common";
import { ReactComponent as PDF_ICON} from '../../assets/images/pdf-icon.svg';
import { ReactComponent as DOC_ICON} from '../../assets/images/word-icon.svg';
import { ReactComponent as PPT_ICON} from '../../assets/images/ppt-icon.svg';
import { ReactComponent as XLS_ICON} from '../../assets/images/excel-icon.svg';

import Icon, { ReloadOutlined, ArrowRightOutlined } from '@ant-design/icons';

const UploadDocument = () => {

  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const [form] = Form.useForm();
  // const formRef = React.createRef();
  const templateRef_C = useRef();
  const templateRef_M = useRef();

  const [instance, setInstance] = useState(null);
  const [file, setFile] = useState(null);
  const [fileList, setFileList] = useState(useSelector(selectAttachFiles)); // 첨부 파일 (max:3개)
  const [hiddenFileUpload, setHiddenFileUpload] = useState(false);
  const [hiddenForm, setHiddenForm] = useState(true);
  const [disableNext, setDisableNext] = useState(true);
  const [tab, setTab] = useState("tab1");
  const [loading, setLoading] = useState(false);

  const user = useSelector(selectUser);
  const { email, _id } = user;

  const documentTitle = useSelector(selectDocumentTitle);
  const documentFile = useSelector(selectDocumentFile);
  const documentType = useSelector(selectDocumentType);
  const template = useSelector(selectTemplate);
  const templateTitle = useSelector(selectTemplateTitle);
  const sendType = useSelector(selectSendType);
  const templateType = useSelector(selectTemplateType);

  const propsAttach = {
    onRemove: file => {
      console.log('onRemove called', file)

      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList)

      // 첨부파일 셋팅
      // dispatch(setAttachFiles(newFileList));
      setAttachFiles(newFileList)
      dispatch(selectAttachFiles);
    },
    beforeUpload: file => {

      console.log('beforeUpload called', file)

      if(fileList.length > 2) {
        message.error('첨부파일 개수는 3개까지 가능합니다!');
        return Upload.LIST_IGNORE;
      }

      const isLt2M = file.size / 1024 / 1024 < 10;
      if (!isLt2M) {
        message.error('File must smaller than 10MB!');
        return Upload.LIST_IGNORE;
      }
      
      file.url = URL.createObjectURL(file)  // 업로드 전에 preview 를 위해 추가
      setFileList([...fileList, file])

      // 첨부파일 셋팅
      // dispatch(setAttachFiles([...fileList, file]));
      setAttachFiles([...fileList, file])
      dispatch(selectAttachFiles);

      return false;
    },
    fileList,
    onPreview: async file => {
      console.log('aa', file)
      // let src = file.url;
      let src = URL.createObjectURL(file)
      console.log('src', src)
      if (!src) {
        src = await new Promise(resolve => {
          const reader = new FileReader();
          reader.readAsDataURL(file.originFileObj);
          reader.onload = () => resolve(reader.result);
        });
      }
      const image = new Image();
      image.src = src;
      const imgWindow = window.open(src);
      imgWindow.document.write(image.outerHTML);
    },
  };

  const fetchUploadTempFile = async () => {
    setLoading(true);


    console.log("파일 임시 업로드 !", file.name.substring(file.name.lastIndexOf('.'), file.name.length).toLowerCase())
    // const filename = `${_id}${Date.now()}.pdf`
    const filename = `${_id}${Date.now()}${file.name.substring(file.name.lastIndexOf('.'), file.name.length).toLowerCase()}`
    const formData = new FormData()
    formData.append('path', 'temp/')
    formData.append('file', file, filename)

    const res = await axios.post(`/api/storage/upload`, formData)
    setLoading(false);

    // 업로드 후 파일 경로 가져오기  
    var docRef = ''
    if (res.data.success){
      if (res.data.file.path) {
        dispatch(setDocumentTempPath(res.data.file.path))
      }
    }   
  };

  useEffect(() => {

    console.log("UploadDocument useEffect called !")
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
    } else if (documentType === 'TEMPLATE' || documentType === 'TEMPLATE_CUSTOM') {
      if (templateType === 'C') { // 회사 템플릿인 경우
        setTab("tab3")
      } else {
        setTab("tab2")
      }
      
      if (templateTitle && template) {
        setDisableNext(false)
      } else {
        setDisableNext(true)
      }
    }

  }, [documentTitle, documentFile, documentType, templateTitle, templateRef_C, templateRef_M]);

  // useEffect(() => {
  //   console.log(tab)
  //   // if (tab === 'tab3') {
  //   //   templateRef_C.current.initTemplateUI();
  //   // } else if (tab === 'tab2') {
  //   //   templateRef_M.current.initTemplateUI();
  //   // }

  //   if (tab === 'tab2') {
  //     templateRef_M.current.initTemplateUI();
  //   }

  // }, [tab])

  useEffect(() => {
    console.log('useEffect[file] called')
    // 템플릿 임시 업로드 
    if (file) {
      console.log('file ok')
      fetchUploadTempFile();
    }
  }, [file]);


  const onFinish = (values) => {
    console.log(values)

    dispatch(setDocumentType('PC'))
    dispatch(setDocumentTitle(values.documentTitle))

    navigate('/assign')
  }

  const templateNext = () => {
    dispatch(setTemplateTitle(templateTitle));
    navigate('/assign');
  }

  const templateChanged = (template) => {
    dispatch(setDocumentType('TEMPLATE'));
    if(template) {
      console.log(template);
      if (template.docTitle.length > 0) {
        setDisableNext(false);
        dispatch(setTemplate(template));
        dispatch(setTemplateTitle(template.docTitle));
        if (sendType !== 'B' && template.signees && template.signees.length > 0) {
          dispatch(setDocumentType('TEMPLATE_CUSTOM'));
          dispatch(setSignees(template.signees));
          dispatch(setObservers(template.observers));
        }
      }
    }
  }

  const templateTitleChanged = (title) => {
    dispatch(setTemplateTitle(title))
  }

  const description = (
    <div>
      <Icon component={PDF_ICON} style={{ fontSize: '300%'}} />
      <Icon component={DOC_ICON} style={{ fontSize: '300%'}} />
      <Icon component={PPT_ICON} style={{ fontSize: '300%'}} />
      <Icon component={XLS_ICON} style={{ fontSize: '300%'}} />
      <br></br>{formatMessage({id: 'input.fileupload.volume'})}
    </div>
  )

  // const initSelectTemplate = (type) => {
  //   if (type === 'C') {

  //     setTimeout(() => {
  //       templateRef_C.current.resetSelect();
  //     }, 1000);
      
  //   } else {

  //     setTimeout(() => {
  //       templateRef_M.current.resetSelect();
  //     }, 1000);

  //   }
  // };

  const fileAttachment = (
    <ProFormUploadButton
      name="attachFile"
      label="첨부파일"
      title="가져오기"
      tooltip="해당 문서에 파일을 첨부하는 경우 사용"
      max={3}
      fieldProps={{
        name: 'file',
        // listType: 'picture-card',
        ...propsAttach
      }}
      // action="/upload.do"
      extra="최대 파일수 3개, 최대 용량 10MB"
    />
  )


  return (
    <div
    style={{
      // background: '#F5F7FA',
      // background: '#FFFFFF',
    }}
    >
      
      <PageContainer
      // ghost
      header={{
        title: (sendType == 'B') ? '서명 요청(대량 전송)' : '서명 요청',
        ghost: true,
        breadcrumb: {
          routes: [
            // {
            //   path: '/',
            //   breadcrumbName: '서명 요청',
            // },
            // {
            //   path: '/',
            //   breadcrumbName: '문서 등록',
            // },
          ],
        },
        extra: [
          <Button key="3" icon={<ReloadOutlined />} onClick={() => form.resetFields()}></Button>,
          <Button key="2" icon={<ArrowRightOutlined />} type="primary" loading={loading} onClick={() => (tab === "tab1") ? form.submit() : templateNext()} disabled={disableNext}>
            {formatMessage({id: 'Next'})}
          </Button>,
        ],
      }}
      content= { <ProCard style={{ background: '#ffffff' }} layout="center"><StepWrite current={0} /></ProCard> }
      footer={[
        // <Button key="3" onClick={() => form.resetFields()}>초기화</Button>,
        // <Button key="2" type="primary" onClick={() => (tab === "tab1") ? form.submit() : templateNext()} disabled={disableNext}>
        //   {formatMessage({id: 'Next'})}
        // </Button>,
      ]}
    >

      <ProCard direction="column" ghost gutter={[0, 16]}>

        {/* <ProCard style={{ background: '#FFFFFF'}} layout="center"><StepWrite current={0} /></ProCard> */}
        <ProCard
          tabs={{
            type: 'card',
            activeKey: tab,
            onChange: (activeKey) => {
              console.log("activeKey:"+activeKey)
              setTab(activeKey)

              if (activeKey === "tab1") {
                // dispatch(setDocumentType('PC'))
              } else if (activeKey === "tab2") {
                // dispatch(setDocumentType('TEMPLATE'))
                dispatch(setTemplateType('M'))

                dispatch(resetTemplate());
                dispatch(resetTemplateTitle());

                // UI 변경은 렌더링이 완료된 후에 해야 하므로 useEffect (tab) 에서 처리함
                // templateRef_M.current.resetSelect();
                
              } else {
                // dispatch(setDocumentType('TEMPLATE'))
                dispatch(setTemplateType('C'))

                dispatch(resetTemplate());
                dispatch(resetTemplateTitle());

                // UI 변경은 렌더링이 완료된 후에 해야 하므로 useEffect (tab) 에서 처리함
                // templateRef_C.current.resetSelect();
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
                description={description}
                // description={formatMessage({id: 'input.fileupload.support'})+", "+formatMessage({id: 'input.fileupload.volume'})}
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
                    console.log("file.type", file.type)
                    if (!(file.type == 'application/pdf' ||
                          file.type == 'application/msword' || 
                          file.type == 'application/vnd.ms-excel' ||
                          file.type == 'application/vnd.ms-powerpoint' || 
                          file.type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                          file.type == 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
                          file.type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
                      console.log(file.type)
                      message.error(`${file.name} is not a pdf, msoffice file`);
                      return Upload.LIST_IGNORE;
                    }

                    if (file.size > 1048576 * 5) {  //5MB
                      console.log(file.size)
                      message.error(`filesize(${common.formatBytes(file.size)}) is bigger than 5MB`);
                      return Upload.LIST_IGNORE;
                    }

                    setFile(file);
                    setDocumentFile(file);

                    form.setFieldsValue({
                      documentTitle: file.name.replace(/\.[^/.]+$/, "").normalize('NFC'),
                    })
            
                    dispatch(selectDocumentFile);

                    // dispatch(setDocumentFile(file));
            
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

              {fileAttachment}

            </ProForm>

          </ProCard.TabPane>


          <ProCard.TabPane key="tab2" tab="개인 템플릿">
              <SelectTemplate type='M' ref={templateRef_M} templateChanged={templateChanged} templateTitleChanged={templateTitleChanged} />
              {fileAttachment}
          </ProCard.TabPane>

          {/* <ProCard.TabPane key="tab3" tab="회사 템플릿">
              <SelectTemplate type='C' ref={templateRef_C} templateChanged={templateChanged} templateTitleChanged={templateTitleChanged} />
              <br></br>
              {fileAttachment}
          </ProCard.TabPane> */}


        </ProCard>
      </ProCard>
      
    </PageContainer>
  </div>
  )

};

export default UploadDocument;
