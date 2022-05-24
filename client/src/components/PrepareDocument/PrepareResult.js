import React, {useEffect, useState} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Modal, Button, Result } from "antd";
import axios from 'axios';
import { PageContainer } from '@ant-design/pro-layout';
import { useIntl } from "react-intl";
import { navigate } from '@reach/router';
import {
  ExclamationCircleOutlined,
  InfoCircleTwoTone,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { setDocToSign } from '../SignDocument/SignDocumentSlice';
import { selectUser } from '../../app/infoSlice';

const { confirm } = Modal;

const PrepareResult = ({location}) => {

  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { _id } = user;
  const { formatMessage } = useIntl();

  const headerTitle = location.state?.headerTitle ? location.state?.headerTitle : '처리 결과'
  const title = location.state?.title ? location.state?.title : '성공적으로 처리되었습니다.'
  const subTitle = location.state?.subTitle ? location.state?.subTitle : ''
  const docId = location.state?.docId ? location.state?.docId : ''

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState();
  const [status, setStatus] = useState(location.state ? location.state.status : 'success');

  const fetch = (params = {}) => {
    setLoading(true);

    axios.post('/api/document/document', params).then(response => {

      console.log(response)
      if (response.data.success) {
        const document = response.data.document;

        setData(document);
        setLoading(false);

        if ((document.orderType === 'A' && document.users.some(e => e === _id)) || (document.orderType === 'S' && document.usersTodo.some(e => e === _id))) { // 본인이 서명 대상인 경우
          console.log("내가 포함됨")
          confirmToSign(document);
        }

      } else {
          setLoading(false);
          alert(response.data.message)
      }

    });
  };

  const confirmToSign = (document) => {
    confirm({
      title: '바로 서명하시겠습니까?',
      icon: <InfoCircleTwoTone />,
      content: '본인 서명 입력이 포함되어 있습니다.',
      okText: '네',
      okType: 'danger',
      cancelText: '아니오',
      onOk() {
        // 서명하기 이동
        const docId = document._id
        const docRef = document.docRef
        const docType = document.docType
        const docUser = document.user
        const observers = document.observers

        const orderType = document.orderType;
        const usersTodo = document.usersTodo;
        const usersOrder = document.usersOrder;
    
        dispatch(setDocToSign({ docRef, docId, docType, docUser, observers, orderType, usersTodo, usersOrder }));

        navigate(`/signDocument`);
      },
      onCancel() {
        console.log('Cancel');
      },
    });    
  }

  const moveToSign = () => {
    const docId = data._id
    const docRef = data.docRef
    const docType = data.docType
    const docUser = data.user
    const observers = data.observers
    const orderType = data.orderType;
    const usersTodo = data.usersTodo;
    const usersOrder = data.usersOrder;

    dispatch(setDocToSign({ docRef, docId, docType, docUser, observers, orderType, usersTodo, usersOrder }));
    navigate(`/signDocument`);
  }

  useEffect(() => {

    console.log("useEffect docId:"+docId)
    if (docId) {
      fetch({docId:docId})
    }
  }, []);

  return (

    <div>
    <PageContainer
        header={{
          title: '처리 결과',
          extra: [           
          <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
            {/* {formatMessage({id: 'Back'})} */}
          </Button>
          ],
        }}
        footer={[
        ]}
    >

      <Result
          status={status}
          title={title}
          subTitle={subTitle}
          extra={[
            ((data?.orderType === 'A' && data?.users.some(e => e === _id)) || (data?.orderType === 'S' && data?.usersTodo.some(e => e === _id))) ?
            <Button type="primary" onClick={() => {moveToSign()}}>
              서명 하기
            </Button> : '',
            <Button onClick={() => navigate('/')}>
              메인 화면 
            </Button>,
            <Button onClick={() => navigate('/documentList')}>내 문서함</Button>,
          ]}
      />

    </PageContainer>
    </div>

  );

};

export default PrepareResult;