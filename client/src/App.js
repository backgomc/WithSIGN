import React, { useEffect, useState } from 'react';
import { Router, Location } from '@reach/router';
import { useSelector, useDispatch } from 'react-redux';
import { navigate } from '@reach/router';
import axios from 'axios';
import { Button } from "antd";
import { view as Header } from './components/Header';
import Assign from './components/Assign/Assign';
import AssignSort from './components/Assign/AssignSort';
import UploadDocument from './components/UploadDocument/UploadDocument';
// import Preparation from './components/Preparation';
import PrepareDocument from './components/PrepareDocument/PrepareDocument';
import SignList from './components/Lists/SignList';
import SignedList from './components/Lists/SignedList';
import DocumentList from './components/Lists/DocumentList';
import TemplateList from './components/Template/TemplateList';
import PreviewPDF from './components/Template/PreviewPDF';
import UploadTemplate from './components/Template/UploadTemplate';
import AssignTemplate from './components/PrepareTemplate/AssignTemplate';
import PrepareTemplate from './components/PrepareTemplate/PrepareTemplate';
import BulkList from './components/Bulk/BulkList';
import BulkDetail from './components/Bulk/BulkDetail';
import LinkList from './components/Link/LinkList';
import LinkDetail from './components/Link/LinkDetail';
import LinkSetting from './components/Link/LinkSetting';
//import QRList from './components/QR/QRList';
//import QRDetail from './components/QR/QRDetail';
import BoardList from './components/Board/BoardList';
import BoardDetail from './components/Board/BoardDetail';
import BoardWrite from './components/Board/BoardWrite';
import BoardModify from './components/Board/BoardModify';
import OpinionList from './components/Board/OpinionList';
import Customer from './components/Customer/Customer';
import FAQList from './components/Board/FAQList';
import Sign from './components/Sign';
import View from './components/View';
import ViewDocument from './components/ViewDocument/ViewDocument';
import SignDirect from './components/SignDirect/SignDirect';
import Welcome from './components/Welcome';
import Home from './components/Home/Home';
// import Footer from './components/Footer/Footer';
import Test4 from './components/Test/Test4';
import Test3 from './components/Test/Test3';
import Test2 from './components/Test/Test2';
import Login from './components/Login/Login';
import Agreement from './components/Login/Agreement';
import InitPassword from './components/Login/InitPassword';
import ResetPassword from './components/Login/ResetPassword';
import Register from './components/Register/Register';
import Setting from './components/Setting/Setting';
import InFolder from './components/MyFolder/FolderDetail';
import MyFolder from './components/MyFolder/FolderList';
import MySign from './components/MySign/MySign';
import Audit from './components/Audit/Audit';
import Terms from './components/Login/Terms';
import Policy from './components/Login/Policy';
import ResultPage from './components/ResultPage/ResultPage';
import AuditCheck from './components/Audit/AuditCheck';
import { setUser, selectUser } from './app/infoSlice';
import { useIntl } from 'react-intl';
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
import UserSelector from './components/Common/UserSelector';
import { FileAddOutlined } from '@ant-design/icons';

const App = () => {
  console.log('start');
  const rqUrl = window.location.href.split('?')[1];
  const param = new URLSearchParams(rqUrl);
  const token = param.get('t');

  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();

  // const [pathname, setPathname] = useState('/');
  const pathname = useSelector(selectPathname);

  useEffect(() => {

    console.log('App called')

    axios.get('/api/users/auth').then(response => {
      console.log('/api/users/auth called!');
      console.log(response);
      if (response.data.success) {
        dispatch(setUser(response.data.user));
        dispatch(setPathname('/'));
        // navigate('/');
      } else {
        
        if (localStorage.getItem('__rToken__') || token) {

          // 2. 토큰 만료 갱신
          if (localStorage.getItem('__rToken__')) {
            let config = {
              headers: {
                'refresh-Token': localStorage.getItem('__rToken__')
              }
            }
            axios.post('api/users/refresh', null, config).then(response => {
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
            axios.post('/api/users/sso', body).then(response => {
              if (response.data.success) {
                dispatch(setUser(response.data.user));
                localStorage.setItem('__rToken__', response.data.user.__rToken__);
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

        } else {
          dispatch(setUser(null));
          navigate('/login');
        }

      }
    });
    return () => {} // cleanup
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
      {...Menus(formatMessage)}
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

        (pathname === '/documentList' || pathname === '/templateList') ?  // 문서 서명 및 에디팅 시는 Footer 제거 (스크롤 공간 확보를 위해)
        '' :
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
      <PrepareDocument path="/prepareDocument" />
      <SignList path="/signList" />
      <SignedList path="/signedList" />
      <DocumentList path="/documentList" />
      <TemplateList path="/templateList" />
      <UploadTemplate path="/uploadTemplate" />
      <AssignTemplate path="/assignTemplate" />
      <PrepareTemplate path="/prepareTemplate" />
      <BulkList path="/bulkList" />
      <BulkDetail path="/bulkDetail" />
      <LinkList path="/linkList" />
      <LinkDetail path="/linkDetail" />
      <LinkSetting path="/linkSetting" />       

      <InFolder path="/inFolder" />
      <MyFolder path="/myFolder" />
      <MySign path="mySign" />
      <Sign path="/signDocument" />
      <ViewDocument path="/viewDocument" />
      <Setting path="/setting" />
      <Test2 path="/test" />
      <Test3 path="/test3" />
      <Test4 path="/test4" />
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
      <SignDirect path="/signDirect" />
      <UserSelector path="/userSelector" />
    </Router>
    <OnRouteChange action={() => { window.scrollTo(0, 0) }} />
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

class OnRouteChangeWorker extends React.Component {
  componentDidUpdate(prevProps) {
    if (this.props.location.pathname !== prevProps.location.pathname) {
      this.props.action();
    }
  }
  render() {
    return null;
  }
}

const OnRouteChange = ({ action }) => (
  <Location>
    {({ location }) => <OnRouteChangeWorker location={location} action={action} />}
  </Location>
)

export default App;
