import React, { useRef, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useIntl } from "react-intl";
import { navigate } from '@reach/router';
import { Row, Col, Button } from 'antd';
import { PageContainer } from '@ant-design/pro-layout';
import { DownloadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import RcResizeObserver from 'rc-resize-observer';
import { selectUser, selectHistory } from '../../app/infoSlice';
import { LICENSE_KEY } from '../../config/Config';
import WebViewer from '@pdftron/webviewer';
import './ViewDocument.css';

const ViewDocument = ({location}) => {
  console.log(location);
  // const [annotManager, setAnnotatManager] = useState(null);
  const [instance, setInstance] = useState(null);
  const [responsive, setResponsive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDownload, setLoadingDownload] = useState([]);

  // const doc = useSelector(selectDocToView);
  const user = useSelector(selectUser);
  const history = useSelector(selectHistory);

  const { docRef, docTitle, _id } = location.state.docInfo;
  const { formatMessage } = useIntl();

  const viewer = useRef(null);

  useEffect(() => {
    WebViewer({
      path: 'webviewer',
      licenseKey: LICENSE_KEY,
      disabledElements: [
        'ribbons',
        'toggleNotesButton',
        'contextMenuPopup'
      ]
    },
    viewer.current
    ).then(async instance => {
      const { annotManager, Annotations, CoreControls } = instance;

      // select only the view group
      instance.setToolbarGroup('toolbarGroup-View');
      CoreControls.setCustomFontURL('/webfonts/');
      
      setInstance(instance);

      // DISTO
      const URL = '/' + docRef;
      console.log('URL:'+URL);
      instance.docViewer.loadDocument(URL);

      const normalStyles = (widget) => {
        if (widget instanceof Annotations.TextWidgetAnnotation) {
          return {
            color: 'black'
          };
        } else if (widget instanceof Annotations.SignatureWidgetAnnotation) {
          return {
          };
        }
      };

      // TODO annotation 수정 안되게 하기
      annotManager.on('annotationChanged', (annotations, action, { imported }) => {
        console.log('annotationChanged called');
        if (imported && action === 'add') {
          annotations.forEach(function(annot) {
            console.log('annot', annot);
            if (annot instanceof Annotations.WidgetAnnotation) {
              Annotations.WidgetAnnotation.getCustomStyles = normalStyles;
              console.log("annot.fieldName:"+annot.fieldName);
              // if (!annot.fieldName.startsWith(_id)) { 
              //   annot.Hidden = true;
              //   annot.Listable = false;
              // }
              // 모든 입력 필드 숨기기
              annot.Hidden = true;
            }
          });
        }
      });
    });
  }, [docRef]);

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
            <Button key="2" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}></Button>,
            <Button key="3" loading={loadingDownload['1']} href={'/admin/document/down/documents/'+_id} download={docTitle+'.pdf'} type="primary" icon={<DownloadOutlined />} onClick={()=> {
              setLoadingDownload( { "1" : true } )
              setTimeout(() => {
                setLoadingDownload( { "1" : false})
              }, 3000);
            }}>
              {formatMessage({id: 'document.download'})}
            </Button>
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
              <div className='webviewer' ref={viewer}></div>
            </Col>
          </Row>
        </RcResizeObserver>
      </PageContainer> 
    </div>
  );
};

export default ViewDocument;
