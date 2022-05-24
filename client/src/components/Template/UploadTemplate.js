import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { navigate } from '@reach/router';
import { selectUser } from '../../app/infoSlice';
import { resetSignee, resetObservers, setTemplateInfo } from '../PrepareTemplate/AssignTemplateSlice';
import 'antd/dist/antd.css';
import { Upload, message, Form, Button, Modal } from 'antd';
import { useIntl } from "react-intl";
import { PageContainer } from '@ant-design/pro-layout';
import ProCard from '@ant-design/pro-card';
import ProForm, { ProFormUploadDragger, ProFormText } from '@ant-design/pro-form';
import '@ant-design/pro-card/dist/card.css';
import 'antd/dist/antd.css';
import '@ant-design/pro-form/dist/form.css';
import WebViewer from '@pdftron/webviewer';
import { LICENSE_KEY } from '../../config/Config';
import Icon, { CheckCircleTwoTone } from '@ant-design/icons';
import { ReactComponent as PDF_ICON} from '../../assets/images/pdf-icon.svg';
import { ReactComponent as DOC_ICON} from '../../assets/images/word-icon.svg';
import { ReactComponent as PPT_ICON} from '../../assets/images/ppt-icon.svg';
import { ReactComponent as XLS_ICON} from '../../assets/images/excel-icon.svg';
import * as common from "../../util/common";

const { confirm } = Modal;

const UploadTemplate = ({location}) => {

  const templateType = location.state.templateType

  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const [form] = Form.useForm();

  const [instance, setInstance] = useState(null)
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [disableNext, setDisableNext] = useState(true);

  const [tempFilePath, setTempFilePath] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);

  const user = useSelector(selectUser);
  const { email, _id } = user;
  const viewer = useRef(null);

  const fetchUploadTempFile = async () => {
    setLoading(true);

    console.log("파일 임시 업로드 !")
    const filename = `${_id}${Date.now()}.pdf`
    const formData = new FormData()
    formData.append('path', 'temp/')
    formData.append('file', file, filename)

    const res = await axios.post(`/api/storage/upload`, formData)
    setLoading(false);

    // 업로드 후 파일 경로 가져오기
    var docRef = ''
    if (res.data.success){
      docRef = res.data.file.path 
      setTempFilePath(docRef)
    }
    
    if(instance && docRef) {
      const URL = '/' + docRef;      
      instance.docViewer.loadDocument(URL);
    }
  };

  useEffect(() => {

    // FILE Thumbnail 추출 
    WebViewer(
      {
        path: 'webviewer',
        licenseKey: LICENSE_KEY,
        disabledElements: [
          'ribbons',
          'toggleNotesButton',
          'searchButton',
          'menuButton',
        ],
      },
      viewer.current,
    )
    .then(instance => {
      setInstance(instance)

      const { docViewer, CoreControls } = instance;
      CoreControls.setCustomFontURL("/webfonts/");
      
      docViewer.on('documentLoaded', () => {
        console.log('documentLoaded called');
        const doc = docViewer.getDocument();
        const pageIdx = 1;

        // doc.loadThumbnailAsync(pageIdx, (thumbnail) => {
        //   // thumbnail is a HTMLCanvasElement or HTMLImageElement
        //   console.log("loadThumbnailAsync called")
        //   console.log('thumbnail:'+thumbnail.toDataURL());

        //   setThumbnail(thumbnail.toDataURL())
        // });

        doc.loadCanvasAsync(({
          pageNumber: 1,
          // zoom: 0.21, // render at twice the resolution //mac: 0.21 window: ??
          width: 300,  // mac 300
          drawComplete: async (thumbnail) => {
            // const pageNumber = 1;
            // optionally comment out "drawAnnotations" below to exclude annotations
            // await instance.docViewer.getAnnotationManager().drawAnnotations(pageNumber, thumbnail);
            // thumbnail is a HTMLCanvasElement or HTMLImageElement
            console.log('thumbnail:'+thumbnail.toDataURL());
            setThumbnail(thumbnail.toDataURL())
          }
        }));

      });


      // docViewer.on('annotationsLoaded', () => {
      //   console.log('annotationsLoaded called');
      //   const doc = docViewer.getDocument();
      //   const pageIdx = 1;
      //   doc.loadCanvasAsync(({
      //     pageNumber: 1,
      //     zoom: 2, // render at twice the resolution
      //     drawComplete: async (thumbnail) => {
      //       // const pageNumber = 1;
      //       // optionally comment out "drawAnnotations" below to exclude annotations
      //       // await instance.docViewer.getAnnotationManager().drawAnnotations(pageNumber, thumbnail);
      //       // thumbnail is a HTMLCanvasElement or HTMLImageElement
      //       console.log('thumbnail:'+thumbnail);
      //       setThumbnail(thumbnail.toDataURL())
      //     }
      //  }));
      // });

    });

  }, []);

  useEffect(() => {
    console.log('useEffect[file] called')
    // 템플릿 임시 업로드 
    // FILE-SAVE
    if (file) {
      console.log('file ok')
      fetchUploadTempFile();
    }
  }, [file]);

  const onFinish = async (values) => {
    console.log(values)

    if (!thumbnail) {
      console.log('waiting thumbnail!')
      return
    }

    setLoading(true);
    // 1. FILE-SAVE -> FILE-MOVE (파일 업로드 순간 서버 임시 폴더에 파일 저장함 : DRM 해제때문에)
    // const filename = `${_id}${Date.now()}.pdf`
    // const formData = new FormData()
    // formData.append('path', 'templates')
    // formData.append('file', file, filename)
    // const res = await axios.post(`/api/storage/upload`, formData)

    // // 업로드 후 파일 경로 가져오기  
    // var docRef = ''
    // if (res.data.success){
    //   docRef = res.data.file.path
    // }

    //1. FILE-MOVE
    let param = {
      origin: tempFilePath,
      target: tempFilePath.replace('temp', 'templates')
    }
    const res = await axios.post('/api/storage/moveFile', param);
    var docRef = ''
    if (res.data.success){
      docRef = res.data.filePath
    }
    
    // 2. DB-SAVE
    let body = {
      user: _id,
      docTitle: form.getFieldValue('documentTitle'),
      email: email,
      docRef: docRef,
      thumbnail: thumbnail,
      type: templateType
    }
    const res2 = await axios.post('/api/template/addTemplate', body);
    setLoading(false);
    if (res2.data.success) {
      confirmToPrepare(res2.data.templateInfo);
    } else {
      navigate('/templateList');
    }
  }

  const confirmToPrepare = (templateInfo) => {
    confirm({
      title: '템플릿 파일이 정상 등록 되었습니다.',
      icon: <CheckCircleTwoTone />,
      content: '참여자 및 입력 항목을 추가 설정 하시겠습니까?',
      okText: '네',
      okType: 'confirm',
      cancelText: '아니오',
      onOk() {
        dispatch(resetSignee());
        dispatch(resetObservers());
        dispatch(setTemplateInfo(templateInfo));
        navigate('/assignTemplate');
      },
      onCancel() {
        navigate('/templateList');
      },
    });
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
          <Button key="1" onClick={() => {navigate(`/templateList`);}}>이전</Button>,
          <Button key="2" onClick={() => form.resetFields()}>{formatMessage({id: 'Initialize'})}</Button>,
          <Button key="3" type="primary" onClick={() => form.submit()} disabled={disableNext}>
            {formatMessage({id: 'Save'})}
          </Button>,
        ],
      }}
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
                max={1} 
                label="" 
                name="dragger" 
                title={formatMessage({id: 'input.fileupload'})}
                // description={formatMessage({id: 'input.fileupload.support'})+", "+formatMessage({id: 'input.fileupload.volume'})}
                description={description}
                fieldProps={{
                  onChange: (info) => {
                    console.log(info.file, info.fileList);
                    if (info.fileList.length == 0) {
                      form.setFieldsValue({
                        documentTitle: "",
                      })
                      setDisableNext(true)
                      setThumbnail(null)
                    }
                  },
                  beforeUpload: file => {
                    // if (file.type !== 'application/pdf') {
                    //   console.log(file.type)
                    //   message.error(`${file.name} is not a pdf file`);
                    //   return Upload.LIST_IGNORE;
                    // }

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
                    
                    form.setFieldsValue({
                      documentTitle: file.name.replace(/\.[^/.]+$/, ""),
                    })

                    // FILE Thumbnail 추출 
                    // WebViewer(
                    //   {
                    //     path: 'webviewer',
                    //     disabledElements: [
                    //       'ribbons',
                    //       'toggleNotesButton',
                    //       'searchButton',
                    //       'menuButton',
                    //     ],
                    //   },
                    //   viewer.current,
                    // )
                    // .then(instance => {
                    //   const { docViewer } = instance;
                
                    //   instance.docViewer.loadDocument(file);
                      
                    //   docViewer.on('documentLoaded', () => {
                    //     console.log('documentLoaded called');
                    //     const doc = docViewer.getDocument();
                    //     const pageIdx = 1;
                
                
                    //     doc.loadThumbnailAsync(pageIdx, (thumbnail) => {
                    //       // thumbnail is a HTMLCanvasElement or HTMLImageElement
                    //       console.log("loadThumbnailAsync called")
                    //       console.log('thumbnail:'+thumbnail.toDataURL());
                
                    //       setThumbnail(thumbnail.toDataURL())
                    //     });
                
                    //   });
                    // });
                        
                    return false;
                  }
                }}
              >
              </ProFormUploadDragger>

              <ProFormText
                name="documentTitle"
                label="템플릿명"
                // width="md"
                tooltip="입력하신 템플릿명으로 표시됩니다."
                placeholder="템플릿명을 입력하세요."
                rules={[{ required: true, message: formatMessage({id: 'input.documentTitle'}) }]}
              />

            </ProForm>

            <div><img src={thumbnail}></img></div>

          </ProCard.TabPane>
        </ProCard>
      </ProCard>
    </PageContainer>
    
    <div className="webviewer" ref={viewer} style={{display:'none'}}></div>
    {/* <div className="webviewer" ref={viewer}></div> */}
  </div>
  )

};

export default UploadTemplate;
