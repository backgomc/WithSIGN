import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import WebViewer from '@pdftron/webviewer';
import { selectUser } from '../../app/infoSlice';
import './ViewDocument.css';

/**
 *  Document Webviewer Test 
 *  */ 
const ViewDocument = () => {

  // const [annotManager, setAnnotatManager] = useState(null);
  const [setInstance] = useState(null);

  const user = useSelector(selectUser);
  const viewer = useRef(null);
  const { _id } = user;

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
      const URL = "/storage/docToSign/60dbfeb557e078050836b4731628149499369.pdf";
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
  }, [_id]);

  return (
    <div>
        <div className="webviewer" ref={viewer}></div>
    </div>
  );
};

export default ViewDocument;