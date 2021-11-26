import React, { useEffect, useState } from 'react';
import { Router } from '@reach/router';
import { useSelector, useDispatch } from 'react-redux';
import { navigate } from '@reach/router';
import axios from 'axios';
import { Button } from "antd";
import { view as Header } from './components/Header';
import Assign from './components/Assign/Assign';
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
import Sign from './components/Sign';
import View from './components/View';
import Welcome from './components/Welcome';
import Home from './components/Home/Home';
// import Footer from './components/Footer/Footer';
import Test from './components/Test/Test';
import Test2 from './components/Test/Test2';
import Login from './components/Login/Login';
import Agreement from './components/Login/Agreement';
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
import { setSendType } from './components/Assign/AssignSlice';
import './App.css';
import LogoImage from './assets/images/logo_withsign1.png'
import LogoText from './assets/images/logo_withsign2.png'

const App = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();

  const [pathname, setPathname] = useState('/');


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
      // navTheme="light"
      title="With Sign"
      // logo="https://gw.alipayobjects.com/mdn/rms_b5fcc5/afts/img/A*1NHAQYduQiQAAAAAAAAAAABkARQnAQ" 로고 이미지 
      // title={LogoText}
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
          {/* <img src={LogoText} />  */}
        </div>
      )}
      {...Menus()}
      location={{
        pathname,
      }}
      style={{
        // height: 500,
      }}

      menuExtraRender={({ collapsed }) =>
        !collapsed && (
          <div>
            <Button type="primary" style={{ width: '100%', background: '#1A4D7D', border:'0' }} onClick={() => {navigate('/uploadDocument')}}>서명 요청</Button>
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
              dispatch(setSendType('G'));
            }
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
        // <div>
        //   <Footer />
        // </div>
        <DefaultFooter
          links={[
            { key: '이용약관', title: '이용약관', href: 'terms' },
            { key: '개인정보처리방침', title: '개인정보처리방침', href: 'policy' },
          ]}
          copyright="WITH SIGN © NH INFORMATION SYSTEM 2021"
        />
      )}     
  >
    <Router>
      <Home path="/" />
      <Assign path="/assign" />
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
      <BoardList path="/customer" />
      <BoardDetail path="/boardDetail" />
      <Audit path="/audit" />
      <AuditCheck path="/auditCheck" />
      <ResultPage path="/resultPage" />
      <Terms path="/terms" />
      <Policy path="/policy" />
      <PreviewPDF path="/previewPDF" />
    </Router>
  </ProLayout>

  </div>

  ) : (
    <div>
      {/* <Header /> */}
      <Router>
        <Login path="/" />
        <Register path="register" />
        <ResetPassword path="resetPassword" />
        <Agreement path="/agreement" />
      </Router>
    </div>
  );
};

export default App;
