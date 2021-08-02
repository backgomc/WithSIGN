import React, { useEffect, useState } from 'react';
import { Router } from '@reach/router';
import { useSelector, useDispatch } from 'react-redux';
import { navigate } from '@reach/router';
import axios from 'axios';
import { view as Header } from './components/Header';
import Assign from './components/Assign/Assign';
import UploadDocument from './components/UploadDocument/UploadDocument';
import Preparation from './components/Preparation';
import SignList from './components/Lists/SignList';
import SignedList from './components/Lists/SignedList';
import DocumentList from './components/Lists/DocumentList';
import TemplateList from './components/Template/TemplateList';
import UploadTemplate from './components/Template/UploadTemplate';
import Sign from './components/Sign';
import View from './components/View';
import PasswordReset from './components/PasswordReset/PasswordReset';
import Welcome from './components/Welcome';
import Footer from './components/Footer/Footer';
import Test from './components/Test/Test';
import Test2 from './components/Test/Test2';
import Login from './components/Login/Login';
import Register from './components/Register/Register';
import MySign from './components/MySign/MySign';
import { setUser, selectUser } from './app/infoSlice';
import ProLayout from '@ant-design/pro-layout';
import Menus from './config/Menus';
import '@ant-design/pro-layout/dist/layout.css';
import 'antd/dist/antd.css';

const App = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();

  const [pathname, setPathname] = useState('/documentList');


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

    <div
    id="test-pro-layout"
    style={{
      height: '100vh',
    }}
    >

    <ProLayout
      title="NHSign"
      // logo="https://gw.alipayobjects.com/mdn/rms_b5fcc5/afts/img/A*1NHAQYduQiQAAAAAAAAAAABkARQnAQ" 로고 이미지 
      menuHeaderRender={(logo, title) => (
        <div
          id="customize_menu_header"
          onClick={() => {
            navigate('/')
          }}
        >
          {logo}
          {title}
        </div>
      )}
      {...Menus()}
      location={{
        pathname,
      }}
      style={{
        height: 500,
      }}
      menuItemRender={(item, dom) => (
        <a
          onClick={() => {
            setPathname(item.path)
            navigate(item.path)
          }}
        >
          {dom}
        </a>
      )}
      rightContentRender={() => (
        <div>
          <Header />
        </div>
      )}
      // footerRender={() => (
      //   <div>
      //     <Footer />
      //   </div>
      // )}     
  >
    <Router>
        <Welcome path="/" />
        <Assign path="/assign" />
        <UploadDocument path="/uploadDocument" />
        <Preparation path="/prepareDocument" />
        <SignList path="/signList" />
        <SignedList path="/signedList" />
        <DocumentList path="/documentList" />
        <TemplateList path="/templateList" />
        <UploadTemplate path="/uploadTemplate" />
        <MySign path="mySign" />
        <Sign path="/signDocument" />
        <View path="/viewDocument" />
        <Test2 path="/test" />
      </Router>
  </ProLayout>

  </div>

  ) : (
    <div>
      {/* <Header /> */}
      <Router>
        <Login path="/" />
        <Register path="register" />
        <PasswordReset path="passwordReset" />
      </Router>
    </div>
  );
};

export default App;
