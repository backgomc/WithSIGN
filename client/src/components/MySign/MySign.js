import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { navigate } from '@reach/router';
import { Spin, Button, Card, Modal } from 'antd';
import { selectUser } from '../../app/infoSlice';
import { useIntl } from "react-intl";
import SignaturePad from "react-signature-canvas";
import "./sigCanvas.css";
import ProCard from '@ant-design/pro-card';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import { DeleteOutlined, DownloadOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { triggerBase64Download } from 'react-base64-downloader';

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

  const renderSigns = data.map((sign, index) => {
    return (
      <ProCard 
      colSpan="300px" 
      layout="center" 
      bordered
      actions={[
        <DeleteOutlined key="delete" onClick={e => { deleteSign(sign._id) }} />,
        <DownloadOutlined key="download" onClick={e => { downloadSign(sign.signData)}} />,
      ]}>
      <img
        src={sign.signData} height="130px"
      />
    </ProCard>
    )
    
  })

  return (
    <div>

    <div style={{ marginBottom: 16 }}>    
      <Button type="primary" onClick={() => {showModal();}}>
        내 사인 등록
      </Button>
    </div>  

    <ProCard style={{ marginTop: 8 }} gutter={[16, 16]} wrap title="">
      {renderSigns}
      {/* <ProCard 
        colSpan="300px" 
        layout="center" 
        bordered
        actions={[
          <DeleteOutlined key="delete" onClick={e => { deleteSign() }} />,
          <DownloadOutlined key="download" />,
        ]}>
        <img
          alt="example"
          src="https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png"
        />
      </ProCard> */}
      
    </ProCard>

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
