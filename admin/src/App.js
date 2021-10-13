import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Router, navigate } from '@reach/router';
import axios from 'axios';
import { setUser, selectUser } from './app/infoSlice';
import ProLayout from '@ant-design/pro-layout';
import Menus from './config/Menus';
import Home from './components/Home/Home';
import UserList from './components/User/UserList';
import DocumentList from './components/Document/DocumentList';
import TemplateList from './components/Template/TemplateList';
import UploadTemplate from './components/Template/UploadTemplate';
import ViewDocument from './components/Document/ViewDocument';
import Footer from './components/Footer/Footer';
import { view as Header } from './components/Header';
import Login from './components/Login/Login';
import Register from './components/Register/Register';
import '@ant-design/pro-layout/dist/layout.css';
import 'antd/dist/antd.css';

const App = () => {

  const user = useSelector(selectUser);
  const dispatch = useDispatch();

  const [pathname, setPathname] = useState('/');  // 시작 path

  useEffect(() => {

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
      footerRender={() => (
        <div>
          <Footer />
        </div>
      )}     
  >
    <Router>
        <Home path="/" />
        <UserList path="/userList" />
        <DocumentList path="/documentList" />
        <TemplateList path="/templateList" />
        <UploadTemplate path="/uploadTemplate" />
        <ViewDocument path="/viewDocument" />
      </Router>
  </ProLayout>

  </div>

  ) : (
    <div>
      {/* <Header /> */}
      <Router>
        <Login path="/" />
        <Register path="/register" />
      </Router>
    </div>
  );


}

export default App;
