// import { useMemo } from 'react'
import React from 'react';
import { useIntl } from 'react-intl';
import { CopyOutlined, FileAddOutlined, SettingOutlined, FileTextOutlined, HighlightOutlined } from '@ant-design/icons';

export default function Menus() {
  const { formatMessage } = useIntl();
  const data = {
    route: {
      path: '/',
      routes: [
        {
          path: '/userList',
          name: formatMessage({id: 'user.manage'}),
          icon: <FileAddOutlined />,
        },
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
      ],
    },
    location: {
      pathname: '/',
    }
  }

  return data;
}