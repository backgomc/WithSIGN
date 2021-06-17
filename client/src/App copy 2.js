import React, { useEffect, useState } from 'react';
import { Router } from '@reach/router';
import { useSelector, useDispatch } from 'react-redux';
import { navigate } from '@reach/router';
import axios from 'axios';

import AssignUsers from './components/AssignUsers';
import SignIn from './components/SignIn/SignIn';
import SignUp from './components/SignUp/SignUp';
import Preparation from './components/Preparation';
import Sign from './components/Sign';
import View from './components/View';
// import Header from './components/Header';
import PasswordReset from './components/PasswordReset/PasswordReset';
import Welcome from './components/Welcome';

import Test from './components/Test/Test';
import Landing from './components/Landing/Landing';
import Login from './components/Login/Login';
import Register from './components/Register/Register';
import { setUser, selectUser } from './app/infoSlice';
import './App.css';


import 'antd/dist/antd.css';
import { Layout, Menu } from 'antd';
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UserOutlined,
  VideoCameraOutlined,
  UploadOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

const App = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();

  const [collapsed, setCollapsed] = useState(false);

  const toggle = () => {
    setCollapsed(!collapsed)
  };

  useEffect(() => {

    console.log('App called')

    axios.get('/api/users/auth').then(response => {
      if (!response.data.isAuth) {
          dispatch(setUser(null));
      } else {
          dispatch(setUser(response.data));
      }
    });

  }, []);

  return user ? (

    <Layout>
    <Sider trigger={null} collapsible collapsed={collapsed}>
      <div className="logo" />
      <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']}>
        <Menu.Item key="1" icon={<UserOutlined />} onClick={event => {navigate(`/`);}}>
          nav 1
        </Menu.Item>
        <Menu.Item key="2" icon={<VideoCameraOutlined />}>
          nav 2
        </Menu.Item>
        <Menu.Item key="3" icon={<UploadOutlined />} onClick={event => {navigate(`/assignUsers`);}}>
          nav 3
        </Menu.Item>
      </Menu>
    </Sider>
    <Layout className="site-layout">
      <Header className="site-layout-background" style={{ padding: 0 }}>
        {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
          className: 'trigger',
          onClick: toggle,
        })}
      </Header>
      <Content
        className="site-layout-background"
        style={{
          margin: '24px 16px',
          padding: 24,
          minHeight: 280,
        }}
      >
        <Router>
          <Welcome path="/" />
          <Landing path="/landing" />
          <AssignUsers path="/assignUsers" />
          <Preparation path="/prepareDocument" />
          <Sign path="/signDocument" />
          <View path="/viewDocument" />
          <Test path="/test" />
        </Router>
      </Content>
    </Layout>
  </Layout>
  ) : (
    <div>
      {/* <Header /> */}
      <Router>
        <Login path="/" />
        <SignUp path="signUp" />
        <Register path="register" />
        <PasswordReset path="passwordReset" />
      </Router>
    </div>
  );
};

export default App;
