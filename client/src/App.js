import React, { useEffect, useState } from 'react';
import { Router } from '@reach/router';
import { useSelector, useDispatch } from 'react-redux';
import { navigate } from '@reach/router';
import axios from 'axios';

import { view as Header } from './components/Header';
import { view as Sidebar } from './components/Sidebar';

import AssignUsers from './components/AssignUsers';
import Assign from './components/Assign/Assign';
import UploadDocument from './components/UploadDocument/UploadDocument';
import SignIn from './components/SignIn/SignIn';
import SignUp from './components/SignUp/SignUp';
import Preparation from './components/Preparation';
import SignList from './components/Lists/SignList';
import SignedList from './components/Lists/SignedList';
import DocumentList from './components/Lists/DocumentList';
import Sign from './components/Sign';
import View from './components/View';
// import Header from './components/Header';
import PasswordReset from './components/PasswordReset/PasswordReset';
import Welcome from './components/Welcome';
import Footer from './components/Footer/Footer';

import { Route } from 'react-router-dom';
import Test from './components/Test/Test';
import Landing from './components/Landing/Landing';
import Login from './components/Login/Login';
import Register from './components/Register/Register';
import { setUser, selectUser } from './app/infoSlice';

import { view as Home } from './components/Home';

import styles from './assets/css/home.module.css';


import 'antd/dist/antd.css';
import { Layout, Menu } from 'antd';
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UserOutlined,
  VideoCameraOutlined,
  UploadOutlined,
} from '@ant-design/icons';

// const { Header, Sider, Content } = Layout;

const App = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();

  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 80 : 256;
  const sidebarStyle = {
    gridTemplateColumns: sidebarWidth + 'px 1fr'
  };

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
    // <>
    // <Route path="/" component={Home} exact />
    // <Route path="/home" component={Home} />
    // </>

    <div style={sidebarStyle} className={styles.container}>
      <div className={styles.header}>
        <Header collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>
      <div className={styles.sidebar}>
        <Sidebar collapsed={collapsed} />
      </div>
      <div className={styles.content}>
        {/* <Route path="/home/assign" component={Assign} /> */}
        {/* <Route path="/home/landing" component={Welcome} /> */}
        {/* <Route path="/home/prepareDocument" component={Preparation} /> */}
        {/* <Route path="/home/users" component={User} />
        <Route path="/home/pkgs" component={Pkg} /> */}

        <Router>
          <Welcome path="/" />
          <Assign path="/assign" />
          <UploadDocument path="/uploadDocument" />
          <Preparation path="/prepareDocument" />
          <SignList path="/signList" />
          <SignedList path="/signedList" />
          <DocumentList path="/documentList" />
          <Sign path="/signDocument" />
          <View path="/viewDocument" />
          <Test path="/test" />
        </Router>
      </div>
  </div>

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
