import React from 'react';
import { CodeSandboxOutlined, FolderOpenOutlined, ReadOutlined, UserSwitchOutlined, SoundOutlined, FileTextOutlined, SettingOutlined } from '@ant-design/icons';

export default function Menus(formatMessage) {
  const data = {
    route: {
      path: '/',
      routes: [
        {
          path: '/folderManage',
          name: formatMessage({id: 'folder.manage'}),
          icon: <FolderOpenOutlined />,
        },
        {
          path: '/documentList',
          name: formatMessage({id: 'document.manage'}),
          icon: <FileTextOutlined />,
        },
        {
          path: '/templateList',
          name: formatMessage({id: 'template.manage'}),
          icon: <ReadOutlined />,
        },
        {
          path: '/userList',
          name: formatMessage({id: 'user.manage'}),
          icon: <UserSwitchOutlined />,
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
