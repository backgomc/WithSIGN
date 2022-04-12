import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Router, Location, navigate } from '@reach/router';
import axios from 'axios';
import { setUser, selectUser } from './app/infoSlice';
import { selectPathname, setPathname } from './config/MenuSlice';
import ProLayout from '@ant-design/pro-layout';
import { useIntl } from 'react-intl';
import Menus from './config/Menus';
// import Home from './components/Home/Home';
import UserList from './components/User/UserList';
import BoardList from './components/Board/BoardList';
import BoardDetail from './components/Board/BoardDetail';
import BoardWrite from './components/Board/BoardWrite';
import BoardModify from './components/Board/BoardModify';
import SystemManage from './components/System/SystemManage';
import DocumentList from './components/Document/DocumentList';
import ViewDocument from './components/Document/ViewDocument';
import AuditCertify from './components/Document/AuditCertify';
import TemplateList from './components/Template/TemplateList';
import UploadTemplate from './components/Template/UploadTemplate';
import Footer from './components/Footer/Footer';
import Header from './components/Header/Header';
import Login from './components/Login/Login';
import '@ant-design/pro-layout/dist/layout.css';
import 'antd/dist/antd.css';
import './App.css';
import LogoImage from './assets/images/logo_withsign1.png'
import LogoText from './assets/images/logo_withsign2.png'

const App = () => {
  
  const rqUrl = window.location.href.split('?')[1];
  const param = new URLSearchParams(rqUrl);
  const token = param.get('t');
  
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();

  const pathname = useSelector(selectPathname);
  
  useEffect(() => {
    // 1.인증 정보 조회
    axios.get('/admin/auth').then(response => {
      if (response.data.success) {
        dispatch(setUser(response.data.user));
        dispatch(setPathname('/documentList'));
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
            axios.post('/admin/refresh', null, config).then(response => {
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
            axios.post('/admin/sso', body).then(response => {
              console.log(response);
              if (response.data.success) {
                dispatch(setUser(response.data.user));
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
        title={<img src={LogoText} alt="WithSIGN"/>}
        // logo="https://gw.alipayobjects.com/mdn/rms_b5fcc5/afts/img/A*1NHAQYduQiQAAAAAAAAAAABkARQnAQ" 로고 이미지
        logo={LogoImage}
        menuHeaderRender={(logo, title) => (
          <div
            id="customize_menu_header"
            onClick={() => {
              dispatch(setPathname('/documentList'));
              navigate('/');
            }}
          >
            {logo}
            {title}
            <h5 style={{'color':'cyan', 'whiteSpace':'nowrap', 'textAlign':'end'}}>&nbsp;{formatMessage({id: 'AppSubName'})}</h5>
          </div>
        )}
        {...Menus(formatMessage)}
        location={{
          pathname,
        }}
        fixSiderbar={true}
        menuItemRender={(item, dom) => (
          // eslint-disable-next-line jsx-a11y/anchor-is-valid
          <a
            onClick={() => {
              dispatch(setPathname(item.path));
              navigate(item.path);
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
        <Router primary={false}>
          <DocumentList path="/" default />
          <UserList path="/userList" />
          <BoardList path="/boardList" />
          <BoardDetail path="/boardDetail" />
          <BoardWrite path="/boardWrite" />
          <BoardModify path="/boardModify" />
          <SystemManage path="/systemManage" />
          <DocumentList path="/documentList" />
          <ViewDocument path="/viewDocument" />
          <AuditCertify path="/auditCertify" />
          <TemplateList path="/templateList" />
          <UploadTemplate path="/uploadTemplate" />
        </Router>
        <OnRouteChange action={() => { window.scrollTo(0, 0) }} />
      </ProLayout>
    </div>
  ) : (
    <div>
      <Router primary={false}>
        <Login path="/login" />
        <Blank path="/" default />
      </Router>
    </div>
  );
}

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
