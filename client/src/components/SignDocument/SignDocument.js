import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch, useStore } from 'react-redux';
import SignaturePad from 'react-signature-canvas';
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
import ProCard, { CheckCard } from '@ant-design/pro-card';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { LICENSE_KEY } from '../../config/Config';
import Item from 'antd/lib/list/Item';

const { confirm } = Modal;
const { TextArea } = Input;

const SignDocument = () => {

  const { formatMessage } = useIntl();

  const [webViewInstance, setWebViewInstance] = useState(null);
  const [annotManager, setAnnotatManager] = useState(null);
  const [annotPosition, setAnnotPosition] = useState(0);
  const [loading, setLoading] = useState(false);
  const [responsive, setResponsive] = useState(false);
  const [disableNext, setDisableNext] = useState(true);
  const [disableCancel, setDisableCancel] = useState(true);
  const [visiblModal, setVisiblModal] = useState(false);
  const [signList, setSignList] = useState([]);
  const [signData, setSignData] = useState('');
  const [signModal, setSignModal] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [textSign, setTextSign] = useState(formatMessage({id: 'sign.complete'}))

  // const dispatch = useDispatch();
  // const uploading = useSelector(selectUploading);
  const doc = useSelector(selectDocToSign);
  const user = useSelector(selectUser);
  const { docRef, docId, docType, docUser, observers, orderType, usersTodo, usersOrder } = doc;
  const { _id } = user;

  const [annotsToDelete, setAnnotsToDelete] = useState([]);
  
  const viewer = useRef(null);
  const cancelMessage = useRef({});

  const sigCanvas = useRef({});
  const clear = () => sigCanvas.current.clear();
  
  const handleOk = async () => {
    if (!sigCanvas.current.isEmpty()) {
      const { docViewer } = webViewInstance;
      const signatureTool = docViewer.getTool('AnnotationCreateSignature');
      await signatureTool.setSignature(sigCanvas.current.toDataURL('image/png'));
      signatureTool.addSignature();
      webViewInstance.closeElements(['signatureModal']);
      webViewInstance.setToolbarGroup('toolbarGroup-View');
    }
    setSignModal(false);
    clear();
  }

  const handleCancel = () => {
    setSignModal(false);
    clear();
  };
  
  useEffect(() => {

    console.log('observers:'+observers)
    if(observers && observers.includes(_id)) {
      setDisableNext(false)
      setTextSign('문서 수신')
    }

    fetchSigns();

    WebViewer(
      {
        path: 'webviewer',
        licenseKey: LICENSE_KEY,
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
          'eraserToolButton',
          'signatureToolGroupButton',
          'viewControlsOverlay',
          // 'toolsOverlay',  // 서명 도구 상호 작용시 필요
          'annotationPopup',
          'annotationStylePopup',
          'toolStylePopup',   // 서명 목록 팝업
          'stylePopup',
          'textPopup',
          'contextMenuPopup',
          'annotationNoteConnectorLine'
        ],
      },
      viewer.current,
    ).then(async instance => {
      const { docViewer, annotManager, Annotations, CoreControls } = instance;
      setAnnotatManager(annotManager);
      setWebViewInstance(instance);

      const signatureTool = docViewer.getTool('AnnotationCreateSignature');
      signatureTool.on('locationSelected', async () => {
        setSignModal(true);
        instance.closeElements(['signatureModal']);
        instance.setToolbarGroup('toolbarGroup-View');
      });

      // set language
      instance.setLanguage('ko');

      // select only the insert group
      instance.disableElements(['header']);
      instance.setToolbarGroup('toolbarGroup-View');
      CoreControls.setCustomFontURL("/webfonts/");

      // load document
      // const storageRef = storage.ref();
      // const URL = await storageRef.child(docRef).getDownloadURL();
      
      // DISTO
      const URL = '/' + docRef;
      docViewer.loadDocument(URL);

      docViewer.on('documentLoaded', () => {
        console.log('documentLoaded called');
        setPageCount(docViewer.getPageCount());
      });

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
        console.log("annotationChanged called(action):"+ action)

        if (!imported && action === 'add') {  // 서명 및 입력값이 추가 된 경우
          setDisableNext(false)
        }

        if (!imported && action === 'delete') {  // 서명 및 입력값이 삭제 된 경우
          annotations.forEach(function(annot) {
            if (annot.ToolName === 'AnnotationCreateSignature') setDisableNext(true);
          });
        }

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

            } else {
              console.log('일반 편집한 텍스트 컴포넌트')
              // annot.Listable = false;

              // const annotsToDeleteNew = annotsToDelete.slice()
              // annotsToDeleteNew.push(annot) 
              // setAnnotsToDelete(annotsToDeleteNew)
              // annotsToDelete.push(annot);

              setAnnotsToDelete(annotsToDelete => [...annotsToDelete, annot])
            }
          });
        }
      });

      // annotManager.on('fieldChanged', (field, value) => {
      //   console.log("fieldChanged called")
      //   console.log(field, value)
      // })


      // 내 사인 이미지 가져와서 출력하기
      // const res = await axios.post('/api/sign/signs', {user: _id})
      // if (res.data.success) {
      //   const signs = res.data.signs;

      //   var signDatas = []
      //   signs.forEach(element => {
      //     signDatas.push(element.signData)
      //   });

      //   if (signDatas.length > 0) {
      //     const signatureTool = docViewer.getTool('AnnotationCreateSignature');
      //     docViewer.on('documentLoaded', () => {
      //       signatureTool.importSignatures(signDatas);
      //     });
      //   }
      // }
      
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

  const fetchSigns = async () => {
    let param = {
      user: _id
    }
    const res = await axios.post('/api/sign/signs', param);
    if (res.data.success) {
      const signs = res.data.signs;
      setSignList(signs);
    }
  }

  const signCard = (sign) => {
    return <CheckCard style={{width:'auto', height: 'auto'}} value={sign.signData} avatar={sign.signData} className='customSignCardCSS'/>
  }
  
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

    console.log('pageCount:'+pageCount)

    //TODO: 서명요청자가 요청 시 작성한 freetext는 xfdf 추출 시 제외하여야 함 
    // TYPE: Widget, 자유 텍스트, 서명 
    // TYPE 이 아니라 다른 키값을 부여해서 제외시켜야 될듯
    // const annotationsList = annotManager.getAnnotationsList();
    // const annotsToDelete = [];
    // await Promise.all(
    //   annotationsList.map(async (annot, index) => {
    //     console.log('annot.Subject:'+annot.Subject)
    //     if (annot.Subject == '자유 텍스트') {
    //       console.log('여기 제발 통과하자')
    //       // annotsToDelete.push(annot);
    //       annotManager.deleteAnnotation(annot, false, true);
    //     }
    //   })
    // )
    console.log('annotsToDelete:'+annotsToDelete)
    annotManager.deleteAnnotations(annotsToDelete, null, true); //다건 처리가 오류나서 일단 단건 처리함

    // field: true 를 해줘야 텍스트 값도 저장됨
    // console.log('annotManager.getAnnotationsList():'+annotManager.getAnnotationsList());
    const xfdf = await annotManager.exportAnnotations({ widgets: false, links: false, fields: true,	annotList: annotManager.getAnnotationsList() });
    // await updateDocumentToSign(docId, email, xfdf);


    // 순차 서명인 경우: 다음 서명 대상자 설정    
    // 설장 참조값: orderType, usersTodo, usersOrder
    var todo = [];
    if(orderType == 'S'){ //순차 서명인 경우 
      if(usersTodo?.length > 0) {
        if (usersTodo?.filter(e => e != _id).length > 0) {   // 본인 제외 같은 레벨에 서명할 사람이 있는 경우 본인만 제외
          todo = usersTodo?.filter(e => e != _id)
        } else { // 다음 레벨의 서명할 사람들을 입력 
          var arr = usersOrder?.filter(e => e.user == usersTodo[0])
          if (arr?.length > 0) {
            todo = usersOrder?.filter(e => e.order == arr[0].order + 1).map(e => e.user)
          }
        }
      }
    }

    let param = {
      docId: docId,
      // email: email,
      user: _id,
      xfdf: xfdf,
      usersTodo: todo
    }
    console.log("completeSigning param:"+param)

    if (docType === 'B') {
      // 벌크방식이면 docRef에 있던 원본파일을 신규 경로로 복사
      // ex) docToSign/bulkId/60dbfeec57e078050836b4741625204681539.pdf
      const res = await axios.post('/api/storage/copyBulk', param)
    } 

    // 파일업로드 된 후에 화면 이동되도록 변경
    try {
      const res = await axios.post('/api/document/updateDocumentToSign', param)
      if (res.data.success) {
        console.log("start merge")
        await mergeAnnotations(docId, res.data.docRef, res.data.xfdfArray, res.data.isLast)
        console.log("end merge")

        // 서명 요청자 paperless 수 증가 시킴
        if(res.data.isLast) {
          await axios.post('/api/users/updatePaperless', {user: docUser._id, paperless: pageCount})
        }

        setLoading(false);
      } else {
        console.log("updateDocumentToSign error")
        setLoading(false);
      } 
    } catch (error) {
      console.log(error)
      setLoading(false);
    }

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
          <Button key="1" danger onClick={() => cancelSigning()}>
            {formatMessage({id: 'sign.cancel'})}
          </Button>,
          <Button key="2" type="primary" loading={loading} onClick={() => completeSigning()} disabled={disableNext}>
            {textSign}
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
            <Button key="submit" type="primary" disabled={disableCancel} loading={loading} onClick={fetchCancelSigning} danger>
              서명 취소하기
            </Button>
          ]}
          >
            취소사유 :
            <TextArea rows={4} ref={cancelMessage} onChange={(t)=> { setDisableCancel(!(t.currentTarget.value.length > 0)) }} />
        </Modal>

        <Modal
          visible={signModal}
          width={450}
          title="직접서명 또는 서명선택"
          onOk={handleOk}
          onCancel={handleCancel}
          footer={[
            <Button key="back" onClick={clear}>지우기</Button>,
            <Button key="submit" type="primary" loading={loading} onClick={handleOk}>확인</Button>
          ]}
          bodyStyle={{padding: '0px 24px'}}
        >
          <ProCard>
            <SignaturePad penColor='black' ref={sigCanvas} canvasProps={{className: 'signCanvas'}} />
          </ProCard>
          <CheckCard.Group style={{width: '100%', margin: '0px', padding: '0px', whiteSpace: 'nowrap', overflow: 'auto', textAlign: 'center'}}
            onChange={(value) => {
              sigCanvas.current.clear();
              if (value) sigCanvas.current.fromDataURL(value);
            }}
          >
            {signList.map((sign) => (signCard(sign)))}
          </CheckCard.Group>
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
