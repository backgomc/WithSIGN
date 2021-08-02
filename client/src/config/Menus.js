// import { useMemo } from "react"
import React from 'react';
import { useIntl } from "react-intl";
import { CopyOutlined, FileAddOutlined, SettingOutlined, FileTextOutlined, HighlightOutlined } from '@ant-design/icons';

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
          path: '/templateList',
          name: formatMessage({id: 'document.template'}),
          icon: <CopyOutlined />,
        },
        {
          path: '/mySign',
          name: formatMessage({id: 'Sign'}),
          icon: <HighlightOutlined />,
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