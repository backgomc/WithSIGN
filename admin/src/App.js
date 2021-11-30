import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Router, navigate } from '@reach/router';
import axios from 'axios';
import { setUser, selectUser } from './app/infoSlice';
import ProLayout from '@ant-design/pro-layout';
import { useIntl } from "react-intl";
import Menus from './config/Menus';
import Home from './components/Home/Home';
import UserList from './components/User/UserList';
import BoardList from './components/Board/BoardList';
import SystemManage from './components/System/SystemManage';
import DocumentList from './components/Document/DocumentList';
import ViewDocument from './components/Document/ViewDocument';
import TemplateList from './components/Template/TemplateList';
import UploadTemplate from './components/Template/UploadTemplate';
import Footer from './components/Footer/Footer';
import Header from './components/Header/Header';
import Login from './components/Login/Login';
import '@ant-design/pro-layout/dist/layout.css';
import 'antd/dist/antd.css';
import './App.css';
import LogoImage from './assets/images/logo_withsign.png'

const App = () => {
  
  const rqUrl = window.location.href.split('?')[1];
  const param = new URLSearchParams(rqUrl);
  const token = param.get('t');
  
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();

  const [pathname, setPathname] = useState('/');  // 시작 path
  
  const defaultPage = () => (
    <div></div>
  )

  useEffect(() => {
    // 1.인증 정보 조회
    axios.get('/api/admin/auth').then(response => {
      if (response.data.success) {
        dispatch(setUser(response.data.user));
        navigate('/');
      } else {
        if (localStorage.getItem('__rToken__') || token) {
          // 2. 토큰 만료 갱신
          if (localStorage.getItem('__rToken__')) {
            let config = {
              headers: {
                'refresh-Token': localStorage.getItem('__rToken__')
              }
            }
            axios.post('/api/admin/refresh', null, config).then(response => {
              if (response.data.success) {
                dispatch(setUser(response.data.user));
                navigate('/');
              } else {
                dispatch(setUser(null));
                navigate('/login');
              }
            });
          }
          // 3. 통합 로그인
          if (token) {
            let body = {
              token: token
            }
            axios.post('/api/admin/sso', body).then(response => {
              console.log(response);
              if (response.data.success) {
                dispatch(setUser(response.data));
                localStorage.setItem('__rToken__', response.data.user.__rToken__);
                navigate('/');
              } else {
                dispatch(setUser(null));
                navigate('/login');
              }
            });
          }
        } else {
          dispatch(setUser(null));
          navigate('/login');
        }
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
        title="With Sign"
        // logo="https://gw.alipayobjects.com/mdn/rms_b5fcc5/afts/img/A*1NHAQYduQiQAAAAAAAAAAABkARQnAQ" 로고 이미지
        logo={LogoImage}
        menuHeaderRender={(logo, title) => (
          <div
            id="customize_menu_header"
            onClick={() => {
              navigate('/')
            }}
          >
            {logo}
            {title}
            <h5 style={{'color':'cyan', 'display':'inline-block'}}>&nbsp;{formatMessage({id: 'AppSubName'})}</h5>
          </div>
        )}
        {...Menus()}
        location={{
          pathname,
        }}
        fixSiderbar={true}
        menuItemRender={(item, dom) => (
          // eslint-disable-next-line jsx-a11y/anchor-is-valid
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
          <Header />
        )}
        footerRender={() => (
          <Footer />
        )}
      >
        <Router>
          <Home path="/" default />
          <UserList path="/userList" />
          <BoardList path="/boardList" />
          <SystemManage path="/systemManage" />
          <DocumentList path="/documentList" />
          <ViewDocument path="/viewDocument" />
          <TemplateList path="/templateList" />
          <UploadTemplate path="/uploadTemplate" />
        </Router>
      </ProLayout>
    </div>
  ) : (
    <div>
      <Router>
        <Login path="/login" />
        <defaultPage path="/" default />
      </Router>
    </div>
  );
}

export default App;
