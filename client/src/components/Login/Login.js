import React, { useState, useRef } from 'react'
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { navigate, Link } from '@reach/router';
// import { loginUser } from '../../api/api'
import { setUser } from '../../app/infoSlice';
import Header from './Header';
import { Checkbox, Button, Form, Input } from 'antd';
import Icon, { UserOutlined, EyeOutlined, LockOutlined } from '@ant-design/icons';
// import logo from '../../assets/images/logo.svg';
import styles from './login.module.css';
// import './login.css';
// const FormItem = Form.Item;
import { useCookies } from 'react-cookie';
import { useIntl } from 'react-intl';

function Login() {
    const dispatch = useDispatch();
    const { formatMessage } = useIntl();

    const [cookies, setCookie, removeCookie] = useCookies(['SABUN']);

    // const inputRef = useRef(null);
    // const [Email, setEmail] = useState("")
    // const [Password, setPassword] = useState("")

    // const emitEmptyEmail = () => {
    //     inputRef.current.focus();
    //     setEmail('');
    //   };
    
    // const onEmailHandler = (event) => {
    //     setEmail(event.currentTarget.value)
    // }

    // const onPasswordHandler = (event) => {
    //     setPassword(event.currentTarget.value)
    // }

    const onFinish = (values) => {
        if (values.remember) {
            setCookie('SABUN', values.SABUN, {maxAge: 30 * 24 * 60 * 60});
        } else {
            removeCookie('SABUN');
        }

        let body = {
            SABUN: values.SABUN,
            password: values.password
        }

        axios.post('/api/users/login', body).then(response => {
            console.log(response);
            if (response.data.success) {
                dispatch(setUser(response.data.user));
                navigate('/', { replace: true });
            } else {
                if (response.data.user) {   // 약관 동의 절차 필요
                    navigate('/agreement', { state: {user: response.data.user}})
                } else {
                    alert(response.data.message ? response.data.message : 'login failed !')
                }
            } 
        });
    }

    // const gotoLogin = (event) => {
    //     event.preventDefault();

    //     let body = {
    //         email: Email,
    //         password: Password
    //     }

    //     axios.post('/api/users/login', body).then(response => {

    //         console.log(response)
    //         if (response.data.success) {
    //             navigate('/');
    //             dispatch(setUser(response.data.user));
    //         } else {
    //             alert('Login Failed')
    //         }
    //       });

    // }

    // const userEmailSuffix = Email ? <Icon type="close-circle" onClick={emitEmptyEmail} /> : null;


    return (
        <>
        <Header></Header>
        <div className={styles.content}>
            <Form
            name="normal_login"
            className="login-form"
            initialValues={{
                SABUN: cookies.SABUN,
                remember: (cookies.SABUN)?true:false
            }}
            onFinish={onFinish}
            >
            <h3>{formatMessage({id: 'Login'})}</h3>
                <Form.Item
                    name="SABUN"
                    rules={[
                    {
                        required: true,
                        message: formatMessage({id: 'input.SABUN'}),
                    },
                    ]}
                >
                    <Input prefix={<UserOutlined className="site-form-item-icon" />} size="large" placeholder="사번"/>
                </Form.Item>
                <Form.Item
                    name="password"
                    rules={[
                    {
                        required: true,
                        message: formatMessage({id: 'input.password'}),
                    },
                    ]}
                >
                    <Input
                    prefix={<LockOutlined className="site-form-item-icon" />}
                    type="password"
                    placeholder="Password"
                    size="large"
                    />
                    {/* <Input.Password  /> */}
                </Form.Item>
                <Form.Item name="remember" valuePropName="checked" style={{display: 'inline-block'}}>
                    <Checkbox>{formatMessage({id: 'RememberMe'})}</Checkbox>
                </Form.Item>
                {/* <a className={styles['login-form-forgot']} href="/initPassword">{formatMessage({id: 'ForgotPassword'})}</a> */}
                <Link to="/initPassword" className={styles['login-form-forgot']} >{formatMessage({id: 'ForgotPassword'})}</Link>
                <Form.Item>
                    <Button type="primary" htmlType="submit" className={styles['login-form-button']} size="large">{formatMessage({id: 'Login'})}</Button>
                    {/* {formatMessage({id: 'Or'})} <Link to="/register">{formatMessage({id: 'Regist'})}</Link> */}
                </Form.Item>
            </Form>
        </div>
        <div className={styles['footer']}>
          © 2021 NH INFORMATION SYSTEM CO.,LTD. ALL RIGHT RESERVED
        </div>
      </>
    )
}

export default Login
