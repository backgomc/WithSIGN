import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { navigate } from '@reach/router';
// import { Box, Column, Heading, Row, Stack, Button } from 'gestalt';
import { Input, Row, Col, Modal, Button } from 'antd';
import { selectDocToSign } from './SignDocumentSlice';
import { selectUser } from '../../app/infoSlice';
import { mergeAnnotations } from '../MergeAnnotations/MergeAnnotations';
import WebViewer from '@pdftron/webviewer';
// import 'gestalt/dist/gestalt.css';
import './SignDocument.css';
import { useIntl } from "react-intl";
import RcResizeObserver from 'rc-resize-observer';
import { PageContainer } from '@ant-design/pro-layout';
import ProCard from '@ant-design/pro-card';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { confirm } = Modal;
const { TextArea } = Input;

const SignDocument = () => {
  const [annotManager, setAnnotatManager] = useState(null);
  const [annotPosition, setAnnotPosition] = useState(0);
  const [loading, setLoading] = useState(false);
  const [responsive, setResponsive] = useState(false);
  const [disableNext, setDisableNext] = useState(false);
  const [visiblModal, setVisiblModal] = useState(false);

  // const dispatch = useDispatch();
  // const uploading = useSelector(selectUploading);
  const doc = useSelector(selectDocToSign);
  const user = useSelector(selectUser);
  const { docRef, docId, docType } = doc;
  const { email, _id } = user;
  const { formatMessage } = useIntl();
  
  const viewer = useRef(null);
  const cancelMessage = useRef({});

  useEffect(() => {
    WebViewer(
      {
        path: 'webviewer',
        disabledElements: [
          'ribbons',
          'toggleNotesButton',
          'searchButton',
          'menuButton',
          'rubberStampToolGroupButton',
          'stampToolGroupButton',
          'fileAttachmentToolGroupButton',
          'calloutToolGroupButton',
          'undo',
          'redo',
          'eraserToolButton'
        ],
      },
      viewer.current,
    ).then(async instance => {
      const { docViewer, annotManager, Annotations } = instance;
      setAnnotatManager(annotManager);

      // set language
      instance.setLanguage('ko');

      // select only the insert group
      instance.setToolbarGroup('toolbarGroup-Insert');

      // load document
      // const storageRef = storage.ref();
      // const URL = await storageRef.child(docRef).getDownloadURL();
      
      const URL = "/storage/" + docRef;
      docViewer.loadDocument(URL);

      const normalStyles = (widget) => {
        if (widget instanceof Annotations.TextWidgetAnnotation) {
          return {
            border: '1px solid #a5c7ff',
            'background-color': '#a5c7ff',
            color: 'black',
          };
        } else if (widget instanceof Annotations.SignatureWidgetAnnotation) {
          return {
            border: '1px solid #a5c7ff',
          };
        }
      };

      annotManager.on('annotationChanged', (annotations, action, { imported }) => {
        console.log("annotationChanged called")
        if (imported && (action === 'add' || action === 'modify')) {
          annotations.forEach(function(annot) {
            if (annot instanceof Annotations.WidgetAnnotation) {
              Annotations.WidgetAnnotation.getCustomStyles = normalStyles;

              console.log("annot.fieldName:"+annot.fieldName)

              if (docType === 'B') {
                if (!annot.fieldName.startsWith('bulk')) { 
                  annot.Hidden = true;
                  annot.Listable = false;
                }
              } else {
                if (!annot.fieldName.startsWith(_id)) { 
                  annot.Hidden = true;
                  annot.Listable = false;
                }
              }

            }
          });
        }
      });

      // annotManager.on('fieldChanged', (field, value) => {
      //   console.log("fieldChanged called")
      //   console.log(field, value)
      // })


      // 내 사인 이미지 가져와서 출력하기
      const res = await axios.post('/api/sign/signs', {user: _id})
      if (res.data.success) {
        const signs = res.data.signs;

        var signDatas = []
        signs.forEach(element => {
          signDatas.push(element.signData)
        });

        if (signDatas.length > 0) {
          const signatureTool = docViewer.getTool('AnnotationCreateSignature');
          docViewer.on('documentLoaded', () => {
            signatureTool.importSignatures(signDatas);
          });
        }
      }
      
      // const signatureTool = docViewer.getTool('AnnotationCreateSignature');
      // console.log('ccc');
      // console.log(signatureTool);
      // const base64Image = "";
      // docViewer.on('documentLoaded', () => {
      //   signatureTool.importSignatures([base64Image]);
      // });


      // 내 사인 저장하기
    //   docViewer.on('annotationsLoaded', async () => {
    //     annotManager.on('annotationSelected', async (annotationList) => {
    //         console.log("annotationList:"+annotationList)
    //         annotationList.forEach(annotation => {
    //             if (annotation.Subject === "Signature")
    //                 extractAnnotationSignature(annotation, docViewer);
    //         })
    //     })
    //   });

    //   async function extractAnnotationSignature(annotation, docViewer) {
    //     // Create a new Canvas to draw the Annotation on
    //     const canvas = document.createElement('canvas');
    //     // Reference the annotation from the Document
    //     const pageMatrix = docViewer.getDocument().getPageMatrix(annotation.PageNumber);
    //     // Set the height & width of the canvas to match the annotation
    //     canvas.height = annotation.Height;
    //     canvas.width = annotation.Width;
    //     const ctx = canvas.getContext('2d');
    //     // Translate the Annotation to the top Top Left Corner of the Canvas ie (0, 0)
    //     ctx.translate(-annotation.X, -annotation.Y);
    //     // Draw the Annotation onto the Canvas
    //     annotation.draw(ctx, pageMatrix);
    //     // Convert the Canvas to a Blob Object for Upload
    //     canvas.toBlob((blob) => {
    //         // Call your Blob Storage Upload Function
    //         console.log("blob:"+blob)
    //     });
    // }


    });
  }, [docRef, _id]);

  const nextField = () => {
    let annots = annotManager.getAnnotationsList();
    if (annots[annotPosition]) {
      annotManager.jumpToAnnotation(annots[annotPosition]);
      if (annots[annotPosition+1]) {
        setAnnotPosition(annotPosition+1);
      }
    }
  }

  const prevField = () => {
    let annots = annotManager.getAnnotationsList();
    if (annots[annotPosition]) {
      annotManager.jumpToAnnotation(annots[annotPosition]);
      if (annots[annotPosition-1]) {
        setAnnotPosition(annotPosition-1);
      }
    }
  }

  const cancelSigning = () => {

    setVisiblModal(true);

    // confirm({
    //   title: '서명 취소하시겠습니까?',
    //   icon: <ExclamationCircleOutlined />,
    //   content: '서명 취소는 되돌릴 수 없습니다.',
    //   okText: '네',
    //   okType: 'danger',
    //   cancelText: '아니오',
    //   onOk() {
    //     fetchCancelSigning(message);
    //   },
    //   onCancel() {
    //     console.log('Cancel');
    //   },
    // });  
  }

  const fetchCancelSigning = async () => {
    setLoading(true);
    
    let param = {
      docId: docId,
      user: _id,
      message: cancelMessage.current.resizableTextArea.props.value  
    }

    const res = await axios.post('/api/document/updateDocumentCancel', param)

    console.log("fetchCancelSigning res:" + res);
    setLoading(false);
    navigate('/documentList');
  }

  const modalCancel = () => {
    setVisiblModal(false);
  };

  const completeSigning = async () => {

    setLoading(true);

    // field: true 를 해줘야 텍스트 값도 저장됨
    const xfdf = await annotManager.exportAnnotations({ widgets: false, links: false, fields: true,	annotList: annotManager.getAnnotationsList() });
    // await updateDocumentToSign(docId, email, xfdf);

    let param = {
      docId: docId,
      // email: email,
      user: _id,
      xfdf: xfdf
    }
    console.log("completeSigning param:"+param)

    if (docType === 'B') {
      //TODO : 1. 벌크방식이면 docRef에 있던 원본파일을 신규 경로로 복사하고 복사 경로로 돌려준다.
      // bulkId를 파라미터로 같이 넘겨주면 좋을 듯 ex) docToSign/bulkId/60dbfeec57e078050836b4741625204681539.pdf
      
      
    } else {
        //TO-BE : 파일업로드 된 후에 화면 이동되도록 변경
        try {
          const res = await axios.post('/api/document/updateDocumentToSign', param)
          if (res.data.success) {
            console.log("start merge")
            await mergeAnnotations(res.data.docRef, res.data.xfdfArray, res.data.isLast)
            console.log("end merge")
            setLoading(false);
          } else {
            console.log("updateDocumentToSign error")
            setLoading(false);
          } 
        } catch (error) {
          console.log(error)
          setLoading(false);
        }
    }


    //AS-IS
    // await axios.post('/api/document/updateDocumentToSign', param).then(response => {
    //   if (response.data.success) {
    //     // merge (pdf + annotaion)
    //     console.log("response.data.isLast : "+ response.data.isLast)
    //     console.log("start merge")
    //     mergeAnnotations(response.data.docRef, response.data.xfdfArray, response.data.isLast)
    //     console.log("end merge")
    //   }
    // });

    navigate('/');
  }

  return (
    <div>
    <PageContainer  
      header={{
        title: '서명 하기',
        ghost: true,
        breadcrumb: {
          routes: [
          ],
        },
        extra: [
          <Button key="3" onClick={() => {navigate(`/documentList`);}}>{formatMessage({id: 'document.list'})}</Button>,
          <Button key="1" type="primary" danger onClick={() => cancelSigning()}>
            {formatMessage({id: 'sign.cancel'})}
          </Button>,
          <Button key="2" type="primary" onClick={() => completeSigning()} disabled={disableNext}>
            {formatMessage({id: 'sign.complete'})}
          </Button>,
        ],
      }}
      // content= {}
      footer={[
      ]}
      loading={loading}
    >
      <RcResizeObserver
        key="resize-observer"
        onResize={(offset) => {
          setResponsive(offset.width < 596);
        }}
      >
        <Row gutter={[24, 24]}>
          <Col span={24}>
          <div className="webviewer" ref={viewer}></div>
          </Col>
        </Row>

        <Modal
          visible={visiblModal}
          width={400}
          title="서명 취소하시겠습니까?"
          content="서명 취소는 되돌릴 수 없습니다."
          onOk={fetchCancelSigning}
          onCancel={modalCancel}
          footer={[
            <Button key="back" onClick={modalCancel}>
              닫기
            </Button>,
            <Button key="submit" type="primary" loading={loading} onClick={fetchCancelSigning} danger>
              서명 취소하기
            </Button>
          ]}
          >
            취소사유 :
            <TextArea rows={4} ref={cancelMessage} />
        </Modal>

      </RcResizeObserver>
    </PageContainer> 


      {/* <Spin tip={formatMessage({id: 'Processing'})} spinning={loading}>
        <Box display="flex" direction="row" flex="grow">
          <Column span={2}>
            <Box padding={3}>
              <Heading size="md">Sign Document</Heading>
            </Box>
            <Box padding={3}>
              <Row gap={1}>
                <Stack>
                  <Box padding={2}>
                    <Button
                      onClick={nextField}
                      accessibilityLabel="next field"
                      text="Next field"
                      iconEnd="arrow-forward"
                    />
                  </Box>
                  <Box padding={2}>
                    <Button
                      onClick={prevField}
                      accessibilityLabel="Previous field"
                      text="Previous field"
                      iconEnd="arrow-back"
                    />
                  </Box>
                  <Box padding={2}>
                    <Button
                      onClick={completeSigning}
                      accessibilityLabel="complete signing"
                      text="Complete signing"
                      iconEnd="compose"
                    />
                  </Box>
                </Stack>
              </Row>
            </Box>
          </Column>
          <Column span={10}>
            <div className="webviewer" ref={viewer}></div>
          </Column>
        </Box>
      </Spin> */}
    </div>
  );
};

export default SignDocument;
