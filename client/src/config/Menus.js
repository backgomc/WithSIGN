// import { useMemo } from "react"
import React from 'react';
import { useIntl } from "react-intl";
import { FileProtectOutlined, CustomerServiceOutlined, TeamOutlined, CopyOutlined, FileAddOutlined, SettingOutlined, FileTextOutlined, HighlightOutlined, DashboardOutlined } from '@ant-design/icons';


export default function Menus() {
  const { formatMessage } = useIntl();
  const data = {
    route: {
      path: '/',
      routes: [
        {
          path: '/',
          name: formatMessage({id: 'Dashboard'}),
          icon: <DashboardOutlined />,
        },
        // {
        //   path: '/uploadDocument',
        //   name: formatMessage({id: 'document.assign'}),
        //   icon: <FileAddOutlined />,
        // },
        {
          path: '/documentList',
          name: formatMessage({id: 'document.list'}),
          icon: <FileTextOutlined />,
        },
        {
          path: '/bulkList',
          name: formatMessage({id: 'document.bulk'}),
          icon: <TeamOutlined />,
        },
        {
          path: '/templateList',
          name: formatMessage({id: 'document.template'}),
          icon: <CopyOutlined />,
        },
        {
          path: '/mySign',
          name: formatMessage({id: 'sign.management'}),
          icon: <HighlightOutlined />,
        },
        // {
        //   path: '/setting',
        //   name: formatMessage({id: 'Setting'}),
        //   icon: <SettingOutlined />,
        // },
        {
          path: '/auditCheck',
          name: formatMessage({id: 'document.check'}),
          icon: <FileProtectOutlined />,
        },
        {
          path: '/customer',
          name: formatMessage({id: 'Customer'}),
          icon: <CustomerServiceOutlined />,
        },
      ],
    },
    location: {
      pathname: '/',
    }
  }

  return data;
}