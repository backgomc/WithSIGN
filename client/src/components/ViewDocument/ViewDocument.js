import React, { useRef, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { navigate, Link } from '@reach/router';
// import { Box, Column, Heading, Row, Stack, Button } from 'gestalt';
import { Row, Col, Button } from 'antd';
import { selectDocToView } from './ViewDocumentSlice';
import { selectUser, selectHistory } from '../../app/infoSlice';
import WebViewer from '@pdftron/webviewer';
// import 'gestalt/dist/gestalt.css';
import './ViewDocument.css';
import { useIntl } from "react-intl";
import RcResizeObserver from 'rc-resize-observer';
import { PageContainer } from '@ant-design/pro-layout';
import ProCard from '@ant-design/pro-card';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import { DownloadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { LICENSE_KEY } from '../../config/Config';
import {DOCUMENT_SIGNED, DOCUMENT_TOSIGN, DOCUMENT_SIGNING, DOCUMENT_CANCELED, DOCUMENT_TOCONFIRM, DOCUMENT_TODO} from '../../common/Constants';

const ViewDocument = () => {
  const [annotManager, setAnnotatManager] = useState(null);
  const [instance, setInstance] = useState(null);
  const [responsive, setResponsive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDownload, setLoadingDownload] = useState([]);

  const doc = useSelector(selectDocToView);
  const user = useSelector(selectUser);
  const history = useSelector(selectHistory);

  const { docRef, docTitle, docId, status } = doc;
  const { _id } = user;
  const { formatMessage } = useIntl();

  const viewer = useRef(null);

  useEffect(() => {
    WebViewer(
      {
        path: 'webviewer',
        licenseKey: LICENSE_KEY,
        disabledElements: [
          'ribbons',
          'toggleNotesButton',
          'contextMenuPopup',
        ],
      },
      viewer.current,
    ).then(async instance => {

      const { annotManager, Annotations, CoreControls } = instance;

      // select only the view group
      instance.setToolbarGroup('toolbarGroup-View');
      CoreControls.setCustomFontURL("/webfonts/");
      // instance.setToolbarGroup('toolbarGroup-Insert');

      annotManager.setReadOnly(true);

      setInstance(instance);

      // load document
      // const storageRef = storage.ref();
      // const URL = await storageRef.child(docRef).getDownloadURL();
      // console.log(URL);

      // DISTO
      const URL = '/' + docRef;
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

        console.log('annotationChanged called')
        if (imported && action === 'add') {
          annotations.forEach(function(annot) {
            console.log('annot', annot)
            annot.NoMove = true;
            annot.NoDelete = true;
            annot.ReadOnly = true;
            if (annot instanceof Annotations.WidgetAnnotation) {
              Annotations.WidgetAnnotation.getCustomStyles = normalStyles;

              console.log('annot.fieldName:'+annot.fieldName);
              // if (!annot.fieldName.startsWith(_id)) { 
                // annot.Hidden = true;
                // annot.Listable = false;
              // }
              // 모든 입력 필드 숨기기
              // annot.Hidden = true;
              annot.fieldFlags.set('ReadOnly', true);
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
    navigate(history ? history : '/documentList');
  }

  return (
    <div>

    <PageContainer      
      // ghost
      header={{
        title: "문서 조회",
        ghost: true,
        breadcrumb: {
          routes: [
          ],
        },
        extra: [
          <Button key="2" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
            {/* {formatMessage({id: 'Back'})} */}
          </Button>,
          // <Button key="3" type="primary" onClick={() => download()} icon={<DownloadOutlined />}>
          //   {formatMessage({id: 'document.download'})}
          // </Button>
          // AS-IS > TO-BE : 해시값 유지를 위해 서버에 파일을 다운로드 하도록 변경
          // <a href={process.env.REACT_APP_STORAGE_DIR+docRef} download={docTitle+'.pdf'}> 
            // <Button key="3" loading={loadingDownload['1']} href={docRef} download={docTitle+'.pdf'} type="primary" icon={<DownloadOutlined />} onClick={()=> {
          
          // 서명 완료된 문서만 다운로드 되도록 수정 
          (status == DOCUMENT_SIGNED) ? <Button key="3" loading={loadingDownload['1']} href={'/api/storage/documents/'+docId} download={docTitle+'.pdf'} type="primary" icon={<DownloadOutlined />} onClick={()=> {
              setLoadingDownload( { "1" : true } )
              setTimeout(() => {
                setLoadingDownload( { "1" : false})
              }, 3000);
            }}>
              {formatMessage({id: 'document.download'})}
            </Button> : ''
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

      </RcResizeObserver>
    </PageContainer> 

      {/* <Box display="flex" direction="row" flex="grow">
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
      </Box> */}
    </div>
  );
};

export default ViewDocument;
