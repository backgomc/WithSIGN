import React, { useRef, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { navigate } from '@reach/router';
import { Box, Column, Heading, Row, Stack, Button } from 'gestalt';
import { selectDocToView } from './ViewDocumentSlice';
import { selectUser } from '../../app/infoSlice';
import WebViewer from '@pdftron/webviewer';
import 'gestalt/dist/gestalt.css';
import './ViewDocument.css';

const ViewDocument = () => {
  const [annotManager, setAnnotatManager] = useState(null);
  const [instance, setInstance] = useState(null);

  const doc = useSelector(selectDocToView);
  const user = useSelector(selectUser);
  const { docRef } = doc;
  const { email, _id } = user;

  const viewer = useRef(null);

  useEffect(() => {
    WebViewer(
      {
        path: 'webviewer',
        disabledElements: [
          'ribbons',
          'toggleNotesButton',
          'contextMenuPopup',
        ],
      },
      viewer.current,
    ).then(async instance => {

      const { annotManager, Annotations } = instance;

      // select only the view group
      instance.setToolbarGroup('toolbarGroup-View');
      // instance.setToolbarGroup('toolbarGroup-Insert');

      setInstance(instance);

      // load document
      // const storageRef = storage.ref();
      // const URL = await storageRef.child(docRef).getDownloadURL();
      // console.log(URL);
      const URL = "/storage/" + docRef;
      console.log("URL:"+URL);      
      instance.docViewer.loadDocument(URL);

      const normalStyles = (widget) => {
        if (widget instanceof Annotations.TextWidgetAnnotation) {
          return {
            // 'background-color': '#a5c7ff',
            color: 'black',
          };
        } else if (widget instanceof Annotations.SignatureWidgetAnnotation) {
          return {
            // border: '1px solid #a5c7ff',
          };
        }
      };

      // TODO annotation 수정 안되게 하기

      annotManager.on('annotationChanged', (annotations, action, { imported }) => {
        if (imported && action === 'add') {
          annotations.forEach(function(annot) {
            if (annot instanceof Annotations.WidgetAnnotation) {
              Annotations.WidgetAnnotation.getCustomStyles = normalStyles;

              console.log("annot.fieldName:"+annot.fieldName)
              if (!annot.fieldName.startsWith(_id)) { 
                annot.Hidden = true;
                annot.Listable = false;
              }
            }
          });
        }
      });
      
    });
  }, [docRef, _id]);

  const download = () => {
    instance.downloadPdf(true);
  };

  const doneViewing = async () => {
    navigate('/');
  }

  return (
    <div className={'prepareDocument'}>
      <Box display="flex" direction="row" flex="grow">
        <Column span={2}>
          <Box padding={3}>
            <Heading size="md">View Document</Heading>
          </Box>
          <Box padding={3}>
            <Row gap={1}>
              <Stack>
                <Box padding={2}>
                  <Button
                    onClick={download}
                    accessibilityLabel="download signed document"
                    text="Download"
                    iconEnd="download"
                  />
                </Box>
                <Box padding={2}>
                  <Button
                    onClick={doneViewing}
                    accessibilityLabel="complete signing"
                    text="Done viewing"
                    iconEnd="check"
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
    </div>
  );
};

export default ViewDocument;
