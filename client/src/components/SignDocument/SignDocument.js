import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { navigate } from '@reach/router';
import { Box, Column, Heading, Row, Stack, Button } from 'gestalt';
import { Spin } from 'antd';
import { selectDocToSign } from './SignDocumentSlice';
// import { storage, updateDocumentToSign } from '../../firebase/firebase';
// import { selectUser } from '../../firebase/firebaseSlice';
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
