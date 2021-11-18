import React from 'react';
import axios from 'axios';
import { Dropdown, Menu } from 'antd';
import { SettingOutlined, PoweroffOutlined, UserOutlined, CaretDownOutlined, GlobalOutlined } from '@ant-design/icons';
import { navigate, Link } from '@reach/router';
import styles from './header.module.css';
import { useDispatch, useSelector } from 'react-redux';
import { selectUser, setUser } from '../../app/infoSlice';
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

const HeaderComponent = () => {
  const dispatch = useDispatch();

  const user = useSelector(selectUser);
  const { name } = user;

  const localLang = useSelector(selectLang);

  const switchLang = ({ key }) => {
    dispatch(setLang(key));
  };

  const menu = (
    <Menu>
      <Menu.Item key="11">
        <Link to="/systemManage">
          <SettingOutlined />&nbsp;설정
        </Link>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="12">
        <Link to="" onClick={() => {
          axios.post('/api/admin/logout').then(response => {
            if (response.status === 200) {
              localStorage.removeItem('__rToken__');
              dispatch(setUser(null));
              navigate('/login');
            } else {
              alert('Log Out Failed');
            }
          });
        }}>
          <PoweroffOutlined />&nbsp;로그아웃
        </Link>
      </Menu.Item>
    </Menu>
  );

  return (
      <div className={styles['header-user-info']}>
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
  );
};

export default HeaderComponent;
