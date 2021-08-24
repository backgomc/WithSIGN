import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { navigate } from '@reach/router';
import { Spin, Button, Card, Modal, Empty, List } from 'antd';
import { selectUser } from '../../app/infoSlice';
import { useIntl } from "react-intl";
import SignaturePad from "react-signature-canvas";
import ProCard from '@ant-design/pro-card';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import "./sigCanvas.css";
import { DeleteOutlined, DownloadOutlined, ExclamationCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { triggerBase64Download } from 'react-base64-downloader';
import { PageContainer } from '@ant-design/pro-layout';

const { confirm } = Modal;

const MySign = () => {

  const [loading, setLoading] = useState(false);
  const [visiblModal, setVisiblModal] = useState(false);
  const [data, setData] = useState([]);

  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { _id } = user;
  const { formatMessage } = useIntl();

  const sigCanvas = useRef({});
  const clear = () => sigCanvas.current.clear();

  useEffect(() => {
    fetchSigns();
  }, []);

  const fetchSigns = async () => {
    setLoading(true);
    let param = {
      user: _id
    }
    
    const res = await axios.post('/api/sign/signs', param)
    if (res.data.success) {
      const signs = res.data.signs;
      setData(signs)
    }
    setLoading(false);

    // console.log("data:"+data);
  }

  const fetchDeleteSign = async (_id) => {
    setLoading(true);
    let param = {
      _id: _id
    }
    
    const res = await axios.post('/api/sign/deleteSign', param)
    if (res.data.success) {
      fetchSigns();
    }
    setLoading(false);
  }

  const deleteSign = async (_id) => {
    console.log("_id:"+_id)
    confirm({
      title: '삭제하시겠습니까?',
      icon: <ExclamationCircleOutlined />,
      content: '해당 서명이 영구 삭제됩니다.',
      okText: '네',
      okType: 'danger',
      cancelText: '아니오',
      onOk() {
        fetchDeleteSign(_id);
      },
      onCancel() {
        console.log('Cancel');
      },
    });    
  }

  const showModal = () => {
    setVisiblModal(true);
  };

  const handleOk = async () => {
    setLoading(true);
    
    let param = {
      user: _id,
      signData: sigCanvas.current.getTrimmedCanvas().toDataURL("image/png")
    }

    // console.log("param user:"+param.user);
    // console.log("param signData:"+param.signData);

    // 서버업로드
    const res = await axios.post('/api/sign/addSign', param)

    setLoading(false);
    setVisiblModal(false);
    
    sigCanvas.current.clear();

    fetchSigns();

    // setTimeout(() => {
    //   setLoading(false);
    //   setVisiblModal(false);
    // }, 5000);
  };

  const handleCancel = () => {
    setVisiblModal(false);
  };

  const downloadSign = (signData) => {
    triggerBase64Download(signData, 'mysign')
  } 

  // const renderSigns = data.map((sign, index) => {
  //   return (
  //     <ProCard 
  //     colSpan="300px" 
  //     layout="center" 
  //     bordered
  //     actions={[
  //       // <DeleteOutlined key="delete" onClick={e => { deleteSign(sign._id) }} />,
  //       // <DownloadOutlined key="download" onClick={e => { downloadSign(sign.signData)}} />,
  //       <Button type="text" danger icon={<DeleteOutlined />} onClick={e => { deleteSign(sign._id) }}>삭제</Button>,
  //       <Button type="text" icon={<DownloadOutlined />} onClick={e => { downloadSign(sign.signData) }}>다운로드</Button>
  //     ]}>
  //     <img
  //       src={sign.signData} height="130px"
  //     />
  //   </ProCard>
  //   )
    
  // })

  return (
    <div>

    <PageContainer
        ghost
        header={{
          title: formatMessage({id: 'sign.management'}),
          ghost: false,
          breadcrumb: {
            routes: [
              // {
              //   path: '/',
              //   breadcrumbName: 'Home',
              // },
              // {
              //   path: '/',
              //   breadcrumbName: '내 사인',
              // },
            ],
          },
          extra: [
          ],
        }}
        content={'서명에 사용되는 사인을 미리 등록할 수 있습니다.'}
        footer={[
        ]}
    >
    <br></br>
    <List
      rowKey="id"
      loading={loading}
      grid={{ gutter: 24, lg: 3, md: 2, sm: 1, xs: 1 }}
      dataSource={['', ...data]}
      renderItem={item => (item ? (
        <List.Item key={item._id}>
          {/* <Card hoverable className={styles.card} actions={[
           <Button type="text" danger icon={<DeleteOutlined />} onClick={e => { deleteSign(item._id) }}>삭제</Button>,
           <Button type="text" icon={<DownloadOutlined />} onClick={e => { downloadSign(item.signData) }}>다운로드</Button>
          ]}>
            <img src={item.signData} height="130px" align="center" />
          </Card>
          
          */}
          <ProCard 
            hover
            colSpan="300px" 
            layout="center" 
            bordered
            style={{ minWidth: "300px" }}
            actions={[
              <Button type="text" danger icon={<DeleteOutlined />} onClick={e => { deleteSign(item._id) }}>삭제</Button>,
              <Button type="text" icon={<DownloadOutlined />} onClick={e => { downloadSign(item.signData) }}>다운로드</Button>
            ]}>
            <img
              src={item.signData} height="130px"
            />
          </ProCard>
        </List.Item>
        ) : (
          <List.Item>
            <Button type="dashed" style={{ height: "236px", width: "100%", minWidth: "300px" }} onClick={() => {showModal();}}>
              <PlusOutlined /> 사인 등록
            </Button>
          </List.Item>
        )
      )}
          />
    
    </PageContainer>


    {/* <div style={{ marginBottom: 16 }}>    
      <Button type="primary" onClick={() => {showModal();}}>
        내 사인 등록
      </Button>
    </div>  

    <ProCard style={{ marginTop: 8 }} gutter={[16, 16]} wrap title="">
      {data.length > 0 ? renderSigns : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}       
    </ProCard> */}

    <Modal
          visible={visiblModal}
          width={400}
          title="내 사인 만들기"
          onOk={handleOk}
          onCancel={handleCancel}
          footer={[
            <Button key="back" onClick={clear}>
              모두 지우기
            </Button>,
            <Button key="submit" type="primary" loading={loading} onClick={handleOk}>
              저장
            </Button>
          ]}
        >
      <SignaturePad
        penColor='black'
        ref={sigCanvas}
        canvasProps={{
          className: "signatureCanvas"
        }}
      />
    </Modal>

    </div>
  );
};

export default MySign;
