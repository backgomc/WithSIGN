import React, { useState, useRef } from 'react'
import { useIntl } from 'react-intl';
import axios from 'axios';
import Header from './Header';
import { navigate } from '@reach/router';
import { message, Button, Form, Input, Card, Space, Statistic } from 'antd';

import { ArrowLeftOutlined } from '@ant-design/icons';
import styles from './login.module.css';
import 'antd/dist/antd.css';

const { Search } = Input;
const { Countdown } = Statistic;

function InitPassword() {
  
  const refCertNo = useRef();
  const [form] = Form.useForm();
  const [visible, setVisible] = useState('hidden');
  const [validTime, setValidTime] = useState(0);
  const [disable1stNext, setDisable1stNext] = useState(true);
  const [disable2ndNext, setDisable2ndNext] = useState(true);
  const [btnText, setBtnText] = useState('발송');
  const { formatMessage } = useIntl();
  
  const onFinish = (values) => {
    let body = {
      argS : values.argSabun,
      argN : values.argName,
      argC : values.argCertNo
    }
    axios.post('/api/users/verify', body).then(response => {
      if (response.data.success) {
        message.success({content: '본인 확인 완료', style: {marginTop: '70vh'}});
        navigate('/resetPassword', { state: {user: response.data.user}});
      } else {
        message.error({content: '사번 또는 이름을 확인할 수 없습니다.', style: {marginTop: '70vh'}});  
      }
    });
  }

  const endCountDown = () => {
    form.setFieldsValue({argCertNo: ''});
    setDisable2ndNext(true);
    setVisible('hidden');
    setBtnText('발송');
  }

  const sendCertNo = () => {
    let body = {
      argS : form.getFieldValue('argSabun'),
      argN : form.getFieldValue('argName')
    }
    axios.post('/api/users/certNo', body).then(response => {
      if (response.data.success) {
        form.setFieldsValue({argCertNo: ''});
        setDisable2ndNext(false);
        setVisible('visible');
        setBtnText('재발송');
        setValidTime(Date.now() + 1000 * 180);
        message.success({content: 'NH With 메시지를 확인하세요.', style: {marginTop: '70vh'}});  
      } else {
        message.error({content: '사번 또는 이름을 확인할 수 없습니다.', style: {marginTop: '70vh'}});  
      }
    });
  }

  const validCheck = () => {
    if ( form.getFieldValue('argSabun') && form.getFieldValue('argName') ) {
      setDisable1stNext(false);
    } else {
      setDisable1stNext(true);
      form.setFieldsValue({argCertNo: ''});
    }
  }

  const formTag = (
    <Card title={'본인 확인 후 비밀번호를 설정해주세요.'}>
      <Form
        form={form}
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        onFinish={onFinish}
      >
        <Form.Item label="사번" name="argSabun" rules={[{ required: true, message: formatMessage({id: 'input.SABUN'}) }]}>
          <Input placeholder="P0000000" allowClear onChange={validCheck}/>
        </Form.Item>
        <Form.Item label="이름" name="argName" rules={[{ required: true, message: formatMessage({id: 'input.name'}) }]}>
          <Input placeholder="홍길동" allowClear onChange={validCheck}/>
        </Form.Item>
        <Form.Item label="With 인증번호" name="argCertNo" rules={[{ required: true, message: '인증번호를 입력하세요!' }]}>
          <Search
            placeholder="oooooo (6자리)"
            allowClear
            enterButton={btnText}
            size="large"
            onSearch={sendCertNo}
            ref={refCertNo}
            disabled={disable1stNext}
          />
        </Form.Item>
        <Form.Item wrapperCol={{offset: 8 }}>
          <Space>
            <Button type="ghost" icon={<ArrowLeftOutlined />} onClick={() => {navigate('/login');}}>로그인</Button>
            <Button type="primary" htmlType="submit" disabled={disable2ndNext} >본인 확인</Button>
            <Countdown valueStyle={{fontSize: '1rem', color: '#1890ff', visibility: visible}} value={validTime} onFinish={endCountDown}/>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  )   
  
  return (
    <>
      <Header></Header>
      <div className={styles.middleCard}>
        {formTag}
      </div>
      <div className={styles['footer']}>
        WITH SIGN © NH INFORMATION SYSTEM 2021
      </div>
    </>
  );
}

export default InitPassword
