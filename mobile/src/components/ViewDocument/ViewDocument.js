import React, { useRef, useEffect } from 'react';
import axiosInterceptor from '../../config/AxiosConfig';
import { useSelector } from 'react-redux';
import { List } from 'antd';
import { selectDocToView } from './ViewDocumentSlice';
import './ViewDocument.css';
import { PageContainer } from '@ant-design/pro-layout';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import { PaperClipOutlined } from '@ant-design/icons';
import { DOCUMENT_SIGNED, TYPE_SIGN, TYPE_IMAGE, TYPE_TEXT, TYPE_CHECKBOX} from '../../common/Constants';
//import PDFViewer from "@niceharu/withpdf";
import PDFViewer from "../WithPDF/PDFViewer";
import styled from 'styled-components';
const PageContainerStyle = styled.div`
.ant-pro-page-container-children-content {
  margin-top: 0px !important; 
  margin-left: 0px !important; 
  margin-right: 0px !important;
}
`;

const ViewDocument = () => {

  //const [loading, setLoading] = useState(false);
  const doc = useSelector(selectDocToView);
  const { docRef, docTitle, docId, status, attachFiles } = doc;
  const pdfRef = useRef();


  const initWithPDF = async () => {
    await pdfRef.current.uploadPDF(docRef, docTitle);

    console.log('status', status)
    if (status !== DOCUMENT_SIGNED) { // items import (완료되지 않은 경우)
      let param = {
        docId: docId,
      }
      let items;
      const res = await axiosInterceptor.post('/api/document/document', param)
      if (res.data.success) {
        items = res.data.document.items;
      }
  
      let renewItems = items.map(item => {
        item.required = false;
        item.disable = true;
        item.borderColor = 'transparent';
        
        if ((item.type === (TYPE_SIGN || TYPE_IMAGE)) && !item.payload) {
          item.hidden = true;
        }
        if (item.type === TYPE_TEXT) {
          if (item.lines.length < 1 || item.lines[0].length < 1) {
            item.hidden = true;
          }
        }
        if (item.type === TYPE_CHECKBOX && !item.checked) {
          item.hidden = true;
        }
        return item;
      })
      await pdfRef.current.importItems(renewItems);
    }

  }

  useEffect(() => {
    initWithPDF();
  }, [docRef]);

  const doneViewing = async () => {
    //navigate(history ? history : '/documentList');
    window.close()
  }

  const listAttachFiles = (
    <List
    size="small"
    split={false}
    dataSource={attachFiles}
    itemLayout="horizontal"
    renderItem={item => <List.Item.Meta avatar={<PaperClipOutlined />} description={ item.originalname } /> }
    />
  )

  return (
    <div>
    <PageContainerStyle>
    <PageContainer      
      // ghost
      header={{
        title: docTitle ? docTitle : "문서 조회",
        ghost: true,
        breadcrumb: {
          routes: [
          ],
        },
        //extra: [
        ///</PageContainerStyle>  <Button key="1" icon={<CloseOutlined />} onClick={doneViewing} accessibilitylabel="complete signing" text="Done viewing" iconend="check"/>
        //],
      }}
      style={{height:`calc(100vh - 72px)`}}
      content= {attachFiles?.length > 0 && listAttachFiles}
      // content= {}
      // footer={[
      // ]}
      //loading={loading}
    >

<PDFViewer ref={pdfRef} isUpload={false} isSave={false} isEditing={false} defaultScale={1.0}></PDFViewer>

    </PageContainer> 
    </PageContainerStyle>
    </div>
  );
};

export default ViewDocument;
