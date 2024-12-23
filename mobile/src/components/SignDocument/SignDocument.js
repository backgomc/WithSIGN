import React, { useRef, useEffect, useState } from 'react';
import { useSelector} from 'react-redux';
import axiosInterceptor from '../../config/AxiosConfig';
import { navigate } from '@reach/router';
import { Input, Modal, Button, List, Spin, message } from 'antd';
import { selectDocToSign } from './SignDocumentSlice';
import { selectUser } from '../../app/infoSlice';
import './SignDocument.css';
import { useIntl } from "react-intl";
import { PageContainer } from '@ant-design/pro-layout';
import { PaperClipOutlined } from '@ant-design/icons';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
// import { LICENSE_KEY, USE_WITHPDF } from '../../config/Config';
import moment from 'moment';
import 'moment/locale/ko';
//import PDFViewer from "@niceharu/withpdf";
import PDFViewer from "../WithPDF/PDFViewer";
import loadash from 'lodash';
import {TYPE_SIGN, TYPE_IMAGE, TYPE_TEXT, TYPE_CHECKBOX, AUTO_NAME, AUTO_JOBTITLE, AUTO_OFFICE, AUTO_DEPART, AUTO_SABUN, AUTO_DATE} from '../../common/Constants';

const { TextArea } = Input;

const SignDocument = () => {
  console.log("🚀 ~ SignDocument ~ SignDocument start")

  const { formatMessage } = useIntl();
  const [loading, setLoading] = useState(false);
  const [disableNext, setDisableNext] = useState(true);
  const [disableCancel, setDisableCancel] = useState(true);
  const [visiblModal, setVisiblModal] = useState(false);
  const [signList, setSignList] = useState([]);
  const [textSign, setTextSign] = useState(formatMessage({id: 'sign.complete'}))
  const doc = useSelector(selectDocToSign);
  const user = useSelector(selectUser);
  const { docRef, docId, docType, docUser, observers, orderType, usersTodo, usersOrder, attachFiles, items, isWithPDF, docTitle } = doc;
  const { _id, name, JOB_TITLE, SABUN, OFFICE_NAME, DEPART_NAME } = user;
  const cancelMessage = useRef({});
  const pdfRef = useRef();
  
  
  const initWithPDF = async () => {
    console.log("🚀 ~ initWithPDF ~ initWithPDF start")
    console.log('🚀-docRef', docRef);

    // loading PDF
    await pdfRef.current.uploadPDF(docRef);
    console.log('🚀-pdfRef', pdfRef);

    // loading items
    console.log('items', items);
    let newItems = loadash.cloneDeep(items);  //items 를 변경하므로 const 속성이 걸린 items 를 copy 해준다.

    let renewItems = newItems.map(item => {
      if (item.uid === _id || item.uid === 'bulk') {
        if (item.type === TYPE_SIGN) { // 서명 컴포넌트만 조정 가능하도록 설정
          item.movable = true;    // 본인 컴포넌트 이동 가능하게 설정
          item.resizable = true;  // 본인 컴포넌트 사이즈 변경 가능하게 설정
        } else {
          item.movable = false;
          item.resizable = false;
          item.disableOptions = true;
        }

        if (item.autoInput) {
          if (item.autoInput === AUTO_NAME) {
            item.lines = [name];
          } else if (item.autoInput === AUTO_JOBTITLE) {
            item.lines = [JOB_TITLE];
          } else if (item.autoInput === AUTO_OFFICE) {
            item.lines = [OFFICE_NAME];
          } else if (item.autoInput === AUTO_DEPART) {
            item.lines = [DEPART_NAME];
          } else if (item.autoInput === AUTO_SABUN) {
            item.lines = [SABUN];
          } else if (item.autoInput === AUTO_DATE) {
            item.lines = [moment().format('YYYY년 MM월 DD일')];
          }
        }
      } else {
        // item.required = false;
        item.disable = true;
        // item.movable = false;
        // item.deletable = false;
        // item.resizable =false;
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
      }
      return item;
    })
    await pdfRef.current.importItems(renewItems);

  }
  
  useEffect(() => {
    console.log('🚀 useEffect observers:'+observers)
    if(observers && observers.includes(_id)) {
      setDisableNext(false)
      setTextSign('문서 수신')
    }

    fetchSigns();
    initWithPDF();

  }, [docRef, _id]);

  const fetchSigns = async () => {
    let param = {
      user: _id
    }

    const res = await axiosInterceptor.post('/api/sign/signs', param);
    console.log("🚀 ~ fetchSigns ~ res:", res)
    
    if (res.data.success) {
      const signs = res.data.signs;
      console.log('signs', signs)
      setSignList(signs);
      if (isWithPDF) {
        pdfRef.current.setSigns(signs);
      }
    }
  }

  const cancelSigning = () => {
    console.log("🚀 ~ cancelSigning ~ cancelSigning")

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

  const SignAdder = async (uid, image) =>{
    // 서버업로드
    let param = {
      user: uid,
      signData: image.src
    }
    const res = axiosInterceptor.post('/api/sign/addSign', param).then(response => {
      console.log("✈️ SignDocument.js - SignAdder response.status : " + response.status)
      fetchSigns()
    })
  }

  const fetchCancelSigning = async () => {
    console.log("🚀 ~ fetchCancelSigning ~ fetchCancelSigning")
    setLoading(true);
    let param = {
      docId: docId,
      user: _id,
      message: cancelMessage.current.resizableTextArea.textArea.value
      // message: cancelMessage.current.resizableTextArea.props.value  
    }

    const res = await axiosInterceptor.post('/api/document/updateDocumentCancel', param)
    console.log("fetchCancelSigning res:" + res);

    setLoading(false);
    if ( res.data.success ) {
      navigate('/ResultPage',{ state : { mainTitle : formatMessage({id: 'm.cancel'}), msg : formatMessage({id: 'm.cancel.success'}), subMsg : docTitle }});
    } else{
      navigate('/ResultPage',{ state : { status : 'error', mainTitle : formatMessage({id: 'm.cancel'}), msg : res.data?.message, subMsg : 'update fail'}});
    }
  }
  

  const modalCancel = () => {
    console.log("🚀 ~ modalCancel ~ modalCancel:")
    setVisiblModal(false);
  };
  


  const send = async () => {
    console.log("🚀 ~ send ~ send:")
    const pageCount = await pdfRef.current.getPageCount();
    const exportItems = await pdfRef.current.exportItems();

    console.log('pageCount', pageCount);
    console.log('exportItems', exportItems);

    // uid 가 본인이거나 uid 필드가 없는 컴포넌트를 서버에 update 해준다.
    let updateItems = [];
    exportItems.forEach(item => {
      if (item.uid === _id || item.uid === 'bulk') { // 본인 컴포넌트 추가
        updateItems.push(item);
      } else {  // 상단 탭을 통해 신규로 등록한 컴포넌트 추가
        if (items.filter(el => el.id === item.id).length < 1) {
          updateItems.push(item);
        }
      }      
    })

    console.log('updateItems', updateItems);

    /*// 순차 서명인 경우: 다음 서명 대상자 설정    
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
    }*/

    setLoading(true);

    let param = {
      docId: docId,
      // email: email,
      user: _id,
      items: updateItems
      //,usersTodo: todo
    }
    console.log("sign param:"+param)

    if (docType === 'B') {
      // 벌크방식이면 docRef에 있던 원본파일을 신규 경로로 복사
      // ex) docToSign/bulkId/60dbfeec57e078050836b4741625204681539.pdf
      const res = await axiosInterceptor.post('/api/storage/copyBulk', param)
    } 

    // 파일업로드 된 후에 화면 이동되도록 변경
    try {
      const res = await axiosInterceptor.post('/api/document/update', param)
      if (res.data.success) {


        // console.log("start merge")
        // await mergeAnnotations(docId, res.data.docRef, res.data.xfdfArray, res.data.isLast)
        // console.log("end merge")

        if(res.data.isLast) {
          console.log('isLast', res.data.isLast)

          // 1. update paperless (서명 요청자 paperless 수 증가)
          await axiosInterceptor.post('/api/users/updatePaperless', {user: docUser._id, paperless: pageCount})

          // 2. merge items & upload merged file     
          const lastItems = res.data.items;
          console.log('lastItems', lastItems);
          const mergedFile = await pdfRef.current.savePDF(true, false, lastItems);
          const formData = new FormData()

          console.log("docRef", docRef)
          console.log("res.data.docRef", res.data.docRef)
          
          const lastDocRef = res.data.docRef;
          var reg = new RegExp('(.*\/).*')
          console.log('path:'+reg.exec(lastDocRef)) //docToSign/614bca38d55fa404d35dad1d/
          formData.append('path', reg.exec(lastDocRef)[1]) //docRef 에서 경로만 추출
          formData.append('isLast', res.data.isLast)
          formData.append('docId', docId)
          formData.append('file', mergedFile, lastDocRef)
          
          const res1 = await axiosInterceptor.post(`/api/storage/upload`, formData)
          console.log('res merged file', res1)

          // 3. updateHash
          let param = {
            docId: docId
          }
          const res2 = await axiosInterceptor.post(`/api/storage/updateHash`, param)
          console.log(res2)
        }

        setLoading(false);
      } else {
        console.log("update error")
        setLoading(false);
        navigate('/ResultPage',{ state : { status : 'error', mainTitle : formatMessage({id: 'm.sign'}), msg : formatMessage({id: 'm.sign.fail'}), subMsg : 'update error'}});
        return;
      } 
    } catch (error) {
      console.log(error)
      setLoading(false);
      navigate('/ResultPage',{ state : { status : 'error', mainTitle : formatMessage({id: 'm.sign'}), msg : formatMessage({id: 'm.sign.fail'}), subMsg : error.msg }});
      return;
    }

    navigate('/ResultPage',{ state : { status : 'success', mainTitle : formatMessage({id: 'm.sign'}), msg : formatMessage({id: 'm.sign.success'}), subMsg : docTitle }});

  }

  const listAttachFiles = (
    <List
    size="small"
    split={false}
    dataSource={attachFiles}
    itemLayout="horizontal"
    renderItem={
      item => <List.Item.Meta avatar={<PaperClipOutlined />} description={ item.originalname } onClick={() => message.info('첨부파일은 PC버전에서 확인 가능합니다')}/>
    }/>
  )

  const handleItemChanged = async (action, item, validation) => {
    console.log("🚀 ~ handleItemChanged ~ handleItemChanged")
    console.log(action, item);
    
    if(item.isSave === true && item.payload){
      pdfRef.current.updateItem(item.id, {isSave: false});
      SignAdder(_id, item.payload)
    }
    // if (action === 'update') {
    //   console.log('validationCheck', validation);
    //   setDisableNext(!validation);
    // }
  }

  const handleValidationChanged = (validation) => {
    console.log('🛸 handleValidationChanged called', validation);
    setDisableNext(!validation);
  }

  return (
    <div>
    <PageContainer  
      // fixedHeader
      header={{
        title: docTitle ? docTitle : '서명 하기',
        ghost: true,
        breadcrumb: {
          routes: [
          ],
        },
        extra: [
          <Button key="1" danger onClick={() => cancelSigning()}>
            {formatMessage({id: 'sign.cancel'})}
          </Button>,
          <Button key="2" type="primary" loading={loading} onClick={() => send()} disabled={disableNext}>
            {textSign}
          </Button>,
        ],
      }}
      style={{height:`calc(100vh - 72px)`}}
      content= {attachFiles?.length > 0 && listAttachFiles}
      // footer={[
      // ]}
      // loading={loading}
    >
      {/* <RcResizeObserver
        key="resize-observer"
        onResize={(offset) => {
          setResponsive(offset.width < 596);
        }}
      > */}
        {/* <Row gutter={[24, 24]}>
          <Col span={24}> */}
          <Spin tip="로딩중..." spinning={loading}>
          <PDFViewer ref={pdfRef} isUpload={false} isSave={false} isEditing={false} onItemChanged={handleItemChanged} onValidationChanged={handleValidationChanged} />
          </Spin>
          {/* </Col>
        </Row> */}

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

      {/* </RcResizeObserver> */}
    </PageContainer> 

    </div>
  );
};

export default SignDocument;
