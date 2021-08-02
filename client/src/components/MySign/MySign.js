import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { navigate } from '@reach/router';
import { Spin, Button, Card } from 'antd';
import { selectUser } from '../../app/infoSlice';
import { useIntl } from "react-intl";
import SignaturePad from "react-signature-canvas";
import "./sigCanvas.css";
import ProCard from '@ant-design/pro-card';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import { EditOutlined, EllipsisOutlined, SettingOutlined } from '@ant-design/icons';

const MySign = () => {

  const [loading, setLoading] = useState(false);
  const [signData, setSignData] = useState(null); 

  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { email, _id } = user;
  const { formatMessage } = useIntl();

  const sigCanvas = useRef({});
  const clear = () => sigCanvas.current.clear();
  const save = () => setSignData(sigCanvas.current.getTrimmedCanvas().toDataURL("image/png"));

  useEffect(() => {

  }, []);

  return (
    <div>
      {/* <Button>www</Button>
      <SignaturePad
        penColor='black'
        ref={sigCanvas}
        canvasProps={{
          className: "signatureCanvas"
        }}
      /> */}
          
    
    <ProCard style={{ marginTop: 8 }} gutter={[16, 16]} wrap title="내 사인">
      <ProCard 
        colSpan="300px" 
        layout="center" 
        bordered
        actions={[
          <SettingOutlined key="setting" />,
          <EditOutlined key="edit" />,
          <EllipsisOutlined key="ellipsis" />,
        ]}>
        <img
          alt="example"
          src="https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png"
        />
      </ProCard>
      
      <ProCard 
        colSpan="300px" 
        layout="center" 
        bordered
        actions={[
          <SettingOutlined key="setting" />,
          <EditOutlined key="edit" />,
          <EllipsisOutlined key="ellipsis" />,
        ]}>
        <img
          alt="example"
          src="https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png"
        />
      </ProCard>

      <ProCard 
        colSpan="300px" 
        layout="center" 
        bordered
        actions={[
          <SettingOutlined key="setting" />,
          <EditOutlined key="edit" />,
          <EllipsisOutlined key="ellipsis" />,
        ]}>
        <img
          alt="example"
          src="https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png"
        />
      </ProCard>

      <ProCard 
        colSpan="300px" 
        layout="center" 
        bordered
        actions={[
          <SettingOutlined key="setting" />,
          <EditOutlined key="edit" />,
          <EllipsisOutlined key="ellipsis" />,
        ]}>
        <img
          alt="example"
          src="https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png"
        />
      </ProCard>

      <ProCard 
        colSpan="300px" 
        layout="center" 
        bordered
        actions={[
          <SettingOutlined key="setting" />,
          <EditOutlined key="edit" />,
          <EllipsisOutlined key="ellipsis" />,
        ]}>
        <img
          alt="example"
          src="https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png"
        />
      </ProCard>

      {/* <ProCard colSpan={{ xs: 24, sm: 12, md: 12, lg: 12, xl: 12 }} layout="center" bordered>
        Col
      </ProCard> */}
    </ProCard>

    {/* <ProCard ghost gutter={[16, 16]}>
          <Card
            style={{ width: 300 }}
            cover={
              <img
                alt="example"
                src="https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png"
              />
            }
            actions={[
              <SettingOutlined key="setting" />,
              <EditOutlined key="edit" />,
              <EllipsisOutlined key="ellipsis" />,
            ]}
          >
          </Card>
          <Card
            style={{ width: 300 }}
            cover={
              <img
                alt="example"
                src="https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png"
              />
            }
            actions={[
              <SettingOutlined key="setting" />,
              <EditOutlined key="edit" />,
              <EllipsisOutlined key="ellipsis" />,
            ]}
          >
          </Card>
    </ProCard> */}
    </div>
  );
};

export default MySign;
