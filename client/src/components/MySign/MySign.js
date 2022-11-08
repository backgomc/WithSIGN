import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch, useStore } from 'react-redux';
import axios from 'axios';
import { navigate } from '@reach/router';
import { Spin, Button, Card, Modal, Empty, List, Form, message, Upload } from 'antd';
import { selectUser } from '../../app/infoSlice';
import { useIntl } from "react-intl";
import SignaturePad from "react-signature-canvas";
import ProCard from '@ant-design/pro-card';
import ProForm, { ProFormUploadDragger } from '@ant-design/pro-form';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import '@ant-design/pro-form/dist/form.css';
import "./sigCanvas.css";
import { DeleteOutlined, DownloadOutlined, ExclamationCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { triggerBase64Download } from 'react-base64-downloader';
import { PageContainer } from '@ant-design/pro-layout';
import * as common from "../../util/common";

const { confirm } = Modal;

const MySign = () => {

  const [loading, setLoading] = useState(false);
  const [visiblModal, setVisiblModal] = useState(false);
  const [data, setData] = useState([]);
  const [tab, setTab] = useState("tab1");
  const [form] = Form.useForm();
  const [disableNext, setDisableNext] = useState(true);
  const [file, setFile] = useState(null);

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

    if (tab == 'tab1') {  //서명 그리기
      setLoading(true);
    
      let param = {
        user: _id,
        signData: sigCanvas.current.toDataURL('image/png')
      }
  
      // 서버업로드
      const res = await axios.post('/api/sign/addSign', param)
  
      setLoading(false);
      setVisiblModal(false);
      
      sigCanvas.current.clear();
  
      fetchSigns();

    } else { // 파일 업로드

      console.log('file upload method !')

      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.addEventListener("load", async function () {
        // convert image file to base64 string
        setLoading(true);

        let param = {
          user: _id,
          signData: reader.result
        }

        // 서버업로드
        const res = await axios.post('/api/sign/addSign', param)
    
        setLoading(false);
        setVisiblModal(false);

        setFile(null);
        form.setFieldsValue({
          dragger: []
        })
        setTab('tab1');
        setDisableNext(true);
            
        fetchSigns();

      }, false);

    }
  };

  const handleCancel = () => {
    setVisiblModal(false);
  };

  const downloadSign = (signData) => {
    triggerBase64Download(signData, 'mysign')
  } 
  
  const onFinish = (values) => {
    console.log(values)

  }

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
      grid={{ gutter: 24, xxl: 4,xl: 3, lg: 2, md: 2, sm: 2, xs: 1 }}
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
            direction="column"
            style={{ minWidth: "280px", height: "192px", marginBottom: '70px' }}
            // bodyStyle={{ padding: '25px'}}
            actions={[
              <Button type="text" danger icon={<DeleteOutlined />} onClick={e => { deleteSign(item._id) }}>삭제</Button>,
              <Button type="text" icon={<DownloadOutlined />} onClick={e => { downloadSign(item.signData) }}>다운로드</Button>
            ]}>
            <img
              src={item.signData} style={{ height: '100%'}}
            />
          </ProCard>
        </List.Item>
        ) : (
          <List.Item>
            <Button type="dashed" style={{ height: "250px", width: "100%", minWidth: "280px" }} onClick={() => {showModal();}}>
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
      width={450}
      title="내 사인 만들기"
      onOk={handleOk}
      onCancel={handleCancel}
      footer={[
        <Button key="back" onClick={clear} hidden={tab!='tab1'}>
          모두 지우기
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleOk} disabled={tab=='tab1'? false : disableNext}>
          저장
        </Button>
      ]}
    >

      <ProCard
        tabs={{
          type: 'card',
          activeKey: tab,
          onChange: (activeKey) => {
            console.log("activeKey:"+activeKey)
            setTab(activeKey)

            // if (activeKey === "tab1") {
            //   dispatch(setDocumentType('PC'))
            // } else {
            //   dispatch(setDocumentType('TEMPLATE'))
            // }
          }
        }}
      >
        <ProCard.TabPane key="tab1" tab="사인 그리기">
          <SignaturePad
            penColor='black'
            ref={sigCanvas}
            canvasProps={{
              className: "signatureCanvas"
            }}
          />

        </ProCard.TabPane>

        <ProCard.TabPane key="tab2" tab="이미지 첨부">
          <ProForm 
              form={form}
              onFinish={onFinish}
              submitter={{
                // Configure the properties of the button
                resetButtonProps: {
                  style: {
                    // Hide the reset button
                    display: 'none',
                  },
                },
                submitButtonProps: {
                  style: {
                    // Hide the reset button
                    display: 'none',
                  },
                }
              }}
              onValuesChange={(changeValues) => {
                console.log("onValuesChange called")
                console.log(changeValues)
                console.log(form.getFieldValue("dragger"))

                if (form.getFieldValue("dragger")) {
                  setDisableNext(false)
                } else {
                  setDisableNext(true)
                }
              }}
            >
              <ProFormUploadDragger 
                max={1} 
                label="" 
                name="dragger" 
                title={formatMessage({id: 'input.fileupload.image'})}
                description={formatMessage({id: 'input.fileupload.support.image'})}
                fieldProps={{
                  listType: 'picture',
                  onChange: (info) => {
                    console.log(info.file, info.fileList);
                    if (info.fileList.length == 0) {
                      setDisableNext(true)
                    }
                  },
                  beforeUpload: file => {
                    console.log("filetype:"+file.type)
                    if ( !(file.type == 'image/jpeg' || file.type == 'image/png') ) {
                      console.log(file.type)
                      message.error(`${file.name} is not a image file`);
                      return Upload.LIST_IGNORE;
                    }

                    if (file.size > 1048576) {  //1MB
                      console.log(file.size)
                      message.error(`filesize(${common.formatBytes(file.size)}) is bigger than 1MB`);
                      return Upload.LIST_IGNORE;
                    }

                    setFile(file);
                                          
                    return false;
                  }
                }}
              >
              </ProFormUploadDragger>

            </ProForm>

        </ProCard.TabPane>
      </ProCard>

    </Modal>

    </div>
  );
};

export default MySign;
