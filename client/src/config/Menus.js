// import { useMemo } from "react"
import React from 'react';
import { useIntl } from "react-intl";
import { CopyOutlined, FileAddOutlined, SettingOutlined, FileTextOutlined } from '@ant-design/icons';

export default function Menus() {
  const { formatMessage } = useIntl();
  const data = {
    route: {
      path: '/',
      routes: [
        {
          path: '/uploadDocument',
          name: formatMessage({id: 'document.assign'}),
          icon: <FileAddOutlined />,
        },
        {
          path: '/documentList',
          name: formatMessage({id: 'document.list'}),
          icon: <FileTextOutlined />,
        },
        {
          path: '/template',
          name: formatMessage({id: 'document.template'}),
          icon: <CopyOutlined />,
        },
        {
          path: '/setting',
          name: formatMessage({id: 'Setting'}),
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