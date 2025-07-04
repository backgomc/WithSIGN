import React from 'react';
import axios from 'axios';
import { Dropdown, Menu, Tag } from 'antd';
import Icon, { SettingOutlined, PoweroffOutlined, MenuUnfoldOutlined, 
  MenuFoldOutlined, UserOutlined, CaretDownOutlined, GlobalOutlined } from '@ant-design/icons';
// import { Link } from 'react-router-dom';
import { navigate, Link } from '@reach/router';
// import session from '../../util/session';
// import { actions as homeActions } from '../../pages/home';
import styles from './header.module.css';
import { useDispatch, useSelector } from 'react-redux';
import { selectUser, setUser } from '../../app/infoSlice';
import { resetSignee } from '../Assign/AssignSlice';
import { selectLang, setLang } from '../../app/langSlice';

const languageList = [
  {
      key: 'kr',
      label: '한글'
  },
  {
    key: 'en',
    label: 'English'
  },
]

const HeaderComponent = ({collapsed, setCollapsed}) => {
  const dispatch = useDispatch();

  const user = useSelector(selectUser);
  const { name, photoURL, email, role, template_flag } = user;

  const localLang = useSelector(selectLang);

  const switchLang = ({ key }) => {
    dispatch(setLang(key));
  };

  const menu = (
    <Menu>
      <Menu.Item key="11">
        <Link to="/setting">
          <SettingOutlined />&nbsp;설정
        </Link>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="12">
        <Link to="" onClick={() => {
          axios.post(`/api/users/logout`).then(response => {
            if (response.status === 200) {
              localStorage.removeItem('__rToken__');
              dispatch(setUser(null));
              dispatch(resetSignee())
              navigate('/login');
            } else {
              alert('Log Out Failed')
            }
          });
        }}>
          <PoweroffOutlined />&nbsp;로그아웃
        </Link>
      </Menu.Item>
    </Menu>
  );

  return (
    <div className={styles['header-wrapper']}>
      {/* <span className={styles['header-collapsed']} onClick={() => setCollapsed(!collapsed)}>
        <Icon component={collapsed ? MenuUnfoldOutlined : MenuFoldOutlined} />
      </span> */}
      <div className={styles['header-user-info']}>
        {role === 1 ? <Tag>관리자</Tag> : template_flag === 1 ? <Tag>양식 관리자</Tag> : '' }
        <Dropdown key="1" overlay={menu}>
          <span className={styles['header-dropdown-link']}>
            <UserOutlined /> &nbsp;
              {name} &nbsp;
            <CaretDownOutlined /> &nbsp;
          </span>
        </Dropdown>
        <Dropdown key="2" overlay={
          <Menu defaultSelectedKeys={[localLang, ]}>
            {
              languageList.map(item => <Menu.Item key={item.key} onClick={switchLang}>{item.label}</Menu.Item>)
            }
          </Menu>
        }>
          <span className={styles['header-dropdown-link']}>
            <GlobalOutlined />
          </span>
        </Dropdown>
      </div>
    </div>
  );
};

export default HeaderComponent;