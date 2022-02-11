import React, { useEffect, useState } from 'react';
import { Router } from '@reach/router';
import { useSelector, useDispatch } from 'react-redux';
import { navigate } from '@reach/router';
import axios from 'axios';
import { Button } from "antd";
import { view as Header } from './components/Header';
import Assign from './components/Assign/Assign';
import AssignSort from './components/Assign/AssignSort';
import UploadDocument from './components/UploadDocument/UploadDocument';
import Preparation from './components/Preparation';
import SignList from './components/Lists/SignList';
import SignedList from './components/Lists/SignedList';
import DocumentList from './components/Lists/DocumentList';
import TemplateList from './components/Template/TemplateList';
import PreviewPDF from './components/Template/PreviewPDF';
import UploadTemplate from './components/Template/UploadTemplate';
import BulkList from './components/Bulk/BulkList';
import BulkDetail from './components/Bulk/BulkDetail';
import BoardList from './components/Board/BoardList';
import BoardDetail from './components/Board/BoardDetail';
import BoardWrite from './components/Board/BoardWrite';
import BoardModify from './components/Board/BoardModify';
import OpinionList from './components/Board/OpinionList';
import Customer from './components/Customer/Customer';
import FAQList from './components/Board/FAQList';
import Sign from './components/Sign';
import View from './components/View';
import Welcome from './components/Welcome';
import Home from './components/Home/Home';
// import Footer from './components/Footer/Footer';
import Test from './components/Test/Test';
import Test2 from './components/Test/Test2';
import Login from './components/Login/Login';
import Agreement from './components/Login/Agreement';
import InitPassword from './components/Login/InitPassword';
import ResetPassword from './components/Login/ResetPassword';
import Register from './components/Register/Register';
import Setting from './components/Setting/Setting';
import MySign from './components/MySign/MySign';
import Audit from './components/Audit/Audit';
import Terms from './components/Login/Terms';
import Policy from './components/Login/Policy';
import ResultPage from './components/ResultPage/ResultPage';
import AuditCheck from './components/Audit/AuditCheck';
import { setUser, selectUser } from './app/infoSlice';
import ProLayout, { DefaultFooter } from '@ant-design/pro-layout';
import Menus from './config/Menus';
import '@ant-design/pro-layout/dist/layout.css';
import 'antd/dist/antd.css';
import { selectPathname, setPathname } from './config/MenuSlice';
import { setSendType, resetAssignAll } from './components/Assign/AssignSlice';
import './App.css';
import LogoImage from './assets/images/logo_withsign1.png'
import LogoText from './assets/images/logo_withsign2.png'
import Manual from './components/Customer/Manual';
import ManualModify from './components/Customer/ManualModify';
import PrepareResult from './components/PrepareDocument/PrepareResult';
import { FileAddOutlined } from '@ant-design/icons';

const App = () => {
  console.log('start');
  const rqUrl = window.location.href.split('?')[1];
  const param = new URLSearchParams(rqUrl);
  const token = param.get('t');

  const user = useSelector(selectUser);
  const dispatch = useDispatch();

  // const [pathname, setPathname] = useState('/');
  const pathname = useSelector(selectPathname);

  useEffect(() => {

    console.log('App called')

    axios.get('/api/users/auth').then(response => {
      console.log(response);
      if (response.data.isAuth) {
        dispatch(setUser(response.data));
        // navigate('/');
      } else {
        // 통합 로그인
        if (token) {
          let body = {
            token: token
          }
          axios.post('/api/users/sso', body).then(response => {
            if (response.data.success) {
              dispatch(setUser(response.data.user));
              navigate('/');
            } else {
              if (response.data.user) { // 약관 동의 절차 필요
                navigate('/agreement', { state: {user: response.data.user}});
              } else {
                alert(response.data.message ? response.data.message : 'login failed !');
                dispatch(setUser(null));
                navigate('/login');
              }
            }
          });
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
      // navTheme="light"
      title={<img src={LogoText} />}
      // logo="https://gw.alipayobjects.com/mdn/rms_b5fcc5/afts/img/A*1NHAQYduQiQAAAAAAAAAAABkARQnAQ" 로고 이미지 
      // title={LogoText}
      logo={LogoImage}
      menuHeaderRender={(logo, title) => (
        <div
          id="customize_menu_header"
          onClick={() => {
            navigate('/');
            dispatch(setPathname('/'));
          }}
        >
          {logo}
          {title}
          {/* <img src={LogoText} />  */}
        </div>
      )}
      {...Menus()}
      location={{
        pathname,
      }}
      fixSiderbar={true}
      style={{
        // height: 500,
      }}

      menuExtraRender={({ collapsed }) =>
        !collapsed && (
          <div>
            <Button type="primary" style={{ width: '100%', background: '#1A4D7D', border:'0' }} onClick={() => {dispatch(resetAssignAll()); dispatch(setSendType('G')); dispatch(setPathname('/documentList')); navigate('/uploadDocument');}}>서명 요청</Button>
          </div>
        )
      }  

      // menuFooterRender={() =>
      //   <div style={{ height: '80px'}}>
      //     <Button style={{ width: '80%'}}>서명 요청</Button>
      //   </div>
      // }
      
      menuItemRender={(item, dom) => (
        <a
          onClick={() => {
            if (item.path === '/uploadDocument') {
              dispatch(resetAssignAll());
              dispatch(setSendType('G'));
            }
            // setPathname(item.path);
            dispatch(setPathname(item.path));
            navigate(item.path);
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
        // <div>
        //   <Footer />
        // </div>
        <DefaultFooter
          links={[
            { key: '이용약관', title: '이용약관', href: 'terms' },
            { key: '개인정보처리방침', title: '개인정보처리방침', href: 'policy' },
          ]}
          copyright="2021 NH INFORMATION SYSTEM CO.,LTD. ALL RIGHT RESERVED"
        />
      )}     
  >
    <Router primary={false}>
      <Home path="/" default />
      <Assign path="/assign" />
      <AssignSort path="/assignSort" />
      <UploadDocument path="/uploadDocument" />
      <Preparation path="/prepareDocument" />
      <SignList path="/signList" />
      <SignedList path="/signedList" />
      <DocumentList path="/documentList" />
      <TemplateList path="/templateList" />
      <UploadTemplate path="/uploadTemplate" />
      <BulkList path="/bulkList" />
      <BulkDetail path="/bulkDetail" />
      <MySign path="mySign" />
      <Sign path="/signDocument" />
      <View path="/viewDocument" />
      <Setting path="/setting" />
      <Test path="/test" />
      <BoardList path="/boardList" />
      <BoardDetail path="/boardDetail" />
      <Audit path="/audit" />
      <AuditCheck path="/auditCheck" />
      <ResultPage path="/resultPage" />
      <Terms path="/terms" />
      <Policy path="/policy" />
      <PreviewPDF path="/previewPDF" />
      <BoardWrite path="/boardWrite" />
      <BoardModify path="/boardModify" />
      <OpinionList path="/opinionList" />
      <FAQList path="/faqList" />
      <Customer path="/customer" />
      <Manual path="/manual" />
      <ManualModify path="/manualModify" />
      <PrepareResult path="/prepareResult" />
    </Router>
  </ProLayout>

  </div>

  ) : (
    <div>
      {/* <Header /> */}
      <Router primary={false}>
        <Login path="/login" />
        {/* <Register path="/register" /> */}
        <InitPassword path="/initPassword" />
        <ResetPassword path="/resetPassword" />
        <Agreement path="/agreement" />
        <Blank path="/" default />
      </Router>
    </div>
  );
};

const Blank = () => <div></div>

export default App;
