import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { navigate } from '@reach/router';
import { Box, Column, Heading, Row, Stack, Button } from 'gestalt';
import { Spin } from 'antd';
import { selectDocToSign } from './SignDocumentSlice';
import { selectUser } from '../../app/infoSlice';
import { mergeAnnotations } from '../MergeAnnotations/MergeAnnotations';
import WebViewer from '@pdftron/webviewer';
import 'gestalt/dist/gestalt.css';
import './SignDocument.css';
import { useIntl } from "react-intl";

const SignDocument = () => {
  const [annotManager, setAnnotatManager] = useState(null);
  const [annotPosition, setAnnotPosition] = useState(0);
  const [loading, setLoading] = useState(false);

  // const dispatch = useDispatch();
  // const uploading = useSelector(selectUploading);
  const doc = useSelector(selectDocToSign);
  const user = useSelector(selectUser);
  const { docRef, docId } = doc;
  const { email, _id } = user;
  const { formatMessage } = useIntl();

  const viewer = useRef(null);

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
              if (!annot.fieldName.startsWith(_id)) { // TODO: 변경해야할듯 email -> _id 06/22
                annot.Hidden = true;
                annot.Listable = false;
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
      const signatureTool = docViewer.getTool('AnnotationCreateSignature');
      console.log('ccc');
      console.log(signatureTool)
      const base64Image = 'data:image/png;base64,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';

      docViewer.on('documentLoaded', () => {
        signatureTool.importSignatures([base64Image]);
      });


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

  const completeSigning = async () => {

    setLoading(true);

    // field: true 를 해줘야 텍스트 값도 저장됨
    const xfdf = await annotManager.exportAnnotations({ widgets: false, links: false, fields: true,	annotList: annotManager.getAnnotationsList() });
    // await updateDocumentToSign(docId, email, xfdf);

    let param = {
      docId: docId,
      // email: email,
      uid: _id,
      xfdf: xfdf
    }
    console.log("completeSigning param:"+param)

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
    <div className={'prepareDocument'}>
      <Spin tip={formatMessage({id: 'Processing'})} spinning={loading}>
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
      </Spin>
    </div>
  );
};

export default SignDocument;
