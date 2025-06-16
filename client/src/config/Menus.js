import React from 'react';
import { FileProtectOutlined, CustomerServiceOutlined, TeamOutlined, CopyOutlined, FileAddOutlined, SettingOutlined, FileTextOutlined, HighlightOutlined, FolderOpenOutlined , DashboardOutlined, QrcodeOutlined, LinkOutlined } from '@ant-design/icons';

export default function Menus(formatMessage) {
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
          path: '/linkList',
          name: formatMessage({id: 'document.link'}),
          icon: <LinkOutlined />,
        },        
        // {
        //   path: '/qrList',
        //   name: formatMessage({id: 'document.qr'}),
        //   icon: <QrcodeOutlined />,
        // },
        {
          path: '/templateList',
          name: formatMessage({id: 'document.template'}),
          icon: <CopyOutlined />,
        },
        {
          path: '/myFolder',
          name: formatMessage({id: 'folder.management'}),
          icon: <FolderOpenOutlined  />,
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