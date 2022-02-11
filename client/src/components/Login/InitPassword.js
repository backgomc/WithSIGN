import React, { useState } from 'react'
import axios from 'axios';
import Header from './Header';
import { navigate, Link } from '@reach/router';
import { Button, Form, Input, Card } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import styles from './login.module.css';
import 'antd/dist/antd.css';

const { Search } = Input;

function InitPassword() {

  const [formPassword] = Form.useForm();
  const [form] = Form.useForm();
  const [formLayout, setFormLayout] = useState('horizontal');

  const onFormLayoutChange = ({ layout }) => {
    setFormLayout(layout);
  };  

  const formItemLayout =
  formLayout === 'horizontal'
    ? {
        labelCol: {
          span: 4,
        },
        wrapperCol: {
          span: 14,
        },
      }
    : null;
const buttonItemLayout =
  formLayout === 'horizontal'
    ? {
        wrapperCol: {
          span: 14,
          offset: 4,
        },
      }
    : null;

  const validateMessages = {
      required: '${label} 을 입력하세요!',
      types: {
        email: '${label}이 유효하지 않습니다!',
        number: '${label} is not a valid number!',
      },
      number: {
        range: '${label} must be between ${min} and ${max}',
      },
    };

    const onFinishPassword = async (values) => {
      console.log(values)
  
      // 비밀번호 변경 API Call
      let param = {
          // user: user,
          currentPassword: 'temp',
          isNew: true,
          password: values.password
  
      }
      const res = await axios.post('/api/users/updatePassword', param)
  
      if (res.data.success) {
        alert('비밀번호가 변경되었습니다!')
        navigate('/login');
      } else {
        alert(res.data.message? res.data.message : '비밀번호 변경에 실패하였습니다!')
      }
    }


  const updatePassword = (
    <Card title={'본인 확인 후 비밀번호를 설정해주세요.'}>
      <Form
      {...formItemLayout}
      layout={formLayout}
      form={form}
      labelCol={{ span: 8  }}
      wrapperCol={{ span: 16 }}
      initialValues={{
        layout: formLayout,
      }}
      onValuesChange={onFormLayoutChange}
    >
      <Form.Item label="사번">
        <Input placeholder="P0000000" allowClear  />
      </Form.Item>
      <Form.Item label="이름">
        <Input placeholder="홍길동" allowClear />
      </Form.Item>
      <Form.Item label="With 인증번호">
        {/* <Input placeholder="oooooooo (8자리)" />
        <Button htmlType="primary">재발송</Button> */}
        <Search
          placeholder="oooooooo (8자리)"
          allowClear
          enterButton="재발송"
          size="large"
          // onSearch={onSearch}
        />
      </Form.Item>
      <Form.Item {...buttonItemLayout} >
        <Button type="primary">뒤로</Button>
        <Button type="primary">본인 확인</Button>
      </Form.Item>
    </Form>
    </Card>
  )   
  
  return (
    <>
      <Header></Header>
      <div className={styles.middleCard}>
        {updatePassword}
      </div>
      <div className={styles['footer']}>
        WITH SIGN © NH INFORMATION SYSTEM 2021
      </div>
    </>
  );
}

export default InitPassword
