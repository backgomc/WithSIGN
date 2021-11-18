// import { useMemo } from 'react'
import React from 'react';
import { useIntl } from 'react-intl';
import { CopyOutlined, FileAddOutlined, SoundOutlined, FileTextOutlined, SettingOutlined } from '@ant-design/icons';

export default function Menus() {
  const { formatMessage } = useIntl();
  const data = {
    route: {
      path: '/',
      routes: [
        {
          path: '/documentList',
          name: formatMessage({id: 'document.manage'}),
          icon: <FileTextOutlined />,
        },
        {
          path: '/templateList',
          name: formatMessage({id: 'template.manage'}),
          icon: <CopyOutlined />,
        },
        {
          path: '/userList',
          name: formatMessage({id: 'user.manage'}),
          icon: <FileAddOutlined />,
        },
        {
          path: '/boardList',
          name: formatMessage({id: 'board.manage'}),
          icon: <SoundOutlined />,
        },
        {
          path: '/systemManage',
          name: formatMessage({id: 'system.manage'}),
          icon: <SettingOutlined />,
        },
      ],
    },
    location: {
      pathname: '/',
    }
  }

  return data;
}