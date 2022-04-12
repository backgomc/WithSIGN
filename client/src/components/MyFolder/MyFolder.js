// import React, { useRef, useEffect, useState, useMemo } from 'react';
// import { useSelector, useDispatch, useStore } from 'react-redux';
// import axios from 'axios';
// import { Button, Card, Modal, List, Form } from 'antd';
// import { selectUser } from '../../app/infoSlice';
// import { useIntl } from "react-intl";
// import ProCard from '@ant-design/pro-card';
// import 'antd/dist/antd.css';
// import '@ant-design/pro-card/dist/card.css';
// import '@ant-design/pro-form/dist/form.css';
// import { DeleteOutlined, DownloadOutlined, PlusOutlined } from '@ant-design/icons';
// import { PageContainer } from '@ant-design/pro-layout';

// import {
//   ChonkyActions,
//   ChonkyFileActionData,
//   FileArray,
//   FileBrowser,
//   FileContextMenu,
//   FileData,
//   FileHelper,
//   FileList,
//   FileNavbar,
//   FileToolbar,
//   setChonkyDefaults,
// } from 'chonky';
// import { ChonkyIconFA } from 'chonky-icon-fontawesome';
// import { showActionNotification, useStoryLinks } from '../util';
// import DemoFsMap from './demo.fs_map.json';

// setChonkyDefaults({ iconComponent: ChonkyIconFA });

// const rootFolderId = DemoFsMap.rootFolderId;
// const fileMap = DemoFsMap.fileMap;

// const { confirm } = Modal;

// const MyFolder = () => {

//   const [loading, setLoading] = useState(false);
//   const [visiblModal, setVisiblModal] = useState(false);
//   const [data, setData] = useState([]);
//   const [tab, setTab] = useState("tab1");
//   const [form] = Form.useForm();
//   const [disableNext, setDisableNext] = useState(true);
//   const [file, setFile] = useState(null);

//   const dispatch = useDispatch();
//   const user = useSelector(selectUser);
//   const { _id } = user;
//   const { formatMessage } = useIntl();

//   const sigCanvas = useRef({});
//   const clear = () => sigCanvas.current.clear();

//   const useFiles = (currentFolderId) => {
//     return useMemo(() => {
//         const currentFolder = fileMap[currentFolderId];
//         const files = currentFolder.childrenIds
//             ? currentFolder.childrenIds.map((fileId) => { var _a; return (_a = fileMap[fileId]) !== null && _a !== void 0 ? _a : null; })
//             : [];
//         return files;
//     }, [currentFolderId]);
//   };

//   const useFolderChain = (currentFolderId) => {
//     return useMemo(() => {
//         const currentFolder = fileMap[currentFolderId];
//         const folderChain = [currentFolder];
//         let parentId = currentFolder.parentId;
//         while (parentId) {
//             const parentFile = fileMap[parentId];
//             if (parentFile) {
//                 folderChain.unshift(parentFile);
//                 parentId = parentFile.parentId;
//             }
//             else {
//                 parentId = null;
//             }
//         }
//         return folderChain;
//     }, [currentFolderId]);
//   };

//   useFileActionHandler = (setCurrentFolderId) => {
//     return useCallback((data) => {
//         if (data.id === ChonkyActions.OpenFiles.id) {
//             const { targetFile, files } = data.payload;
//             const fileToOpen = targetFile !== null && targetFile !== void 0 ? targetFile : files[0];
//             if (fileToOpen && FileHelper.isDirectory(fileToOpen)) {
//                 setCurrentFolderId(fileToOpen.id);
//                 return;
//             }
//         }
//         showActionNotification(data);
//     }, [setCurrentFolderId]);
//   };

//   useEffect(() => {
    
//   }, []);

//   const showModal = () => {
//     setVisiblModal(true);
//   };

//   return (
//     <div>
//       <PageContainer
//           ghost
//           header={{
//             title: formatMessage({id: 'folder.management'}),
//             ghost: false,
//             breadcrumb: {
//               routes: [],
//             },
//             extra: []
//           }}
//           content={'개인 폴더 관리'}
//           footer={[
//           ]}
//       >
//         <div className="story-wrapper">
//             <div className="story-description">
//                 <h1 className="story-title">
//                     {storyName.replace('VFS', 'Virtual File System')}
//                 </h1>
//                 <p>
//                     This example uses the same file map as <em>Advanced mutable VFS</em>
//                     , except it is running in read-only mode. This means nothing will
//                     happen when you try to move or delete files.
//                 </p>
//                 <p>
//                     Read-only mode greatly simplifies the code, so it should be easier
//                     to follow, especially if you're new to Chonky. You can view it using
//                     the buttons below.
//                 </p>
//                 <div className="story-links">
//                     {useStoryLinks([
//                         { gitPath: '2.x_storybook/src/demos/VFSReadOnly.tsx' },
//                         {
//                             name: 'File map JSON',
//                             gitPath: '2.x_storybook/src/demos/demo.fs_map.json',
//                         },
//                     ])}
//                 </div>
//             </div>
//             <ReadOnlyVFSBrowser instanceId={storyName} />
//         </div>
//       </PageContainer>
//     </div>
//   );
// };

// export default MyFolder;

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Table, Input, Button, Space } from 'antd';
import Highlighter from 'react-highlight-words';
import { SearchOutlined } from '@ant-design/icons';
import { get } from 'lodash-es';

const MyFolder = () => {

  const data = [
    {
      key: '1',
      // name: '김김김',
      // age: 32,
      usrInfo: {name: '장보고', age: 32},
      address: 'New York No. 1 Lake Park',
    },
    {
      key: '2',
      // name: '황황황',
      // age: 42,
      usrInfo: {name: '홍길동', age: 42},
      address: 'London No. 1 Lake Park',
    },
    {
      key: '3',
      // name: '중중중',
      // age: 32,
      usrInfo: {name: '정도전', age: 32},
      address: 'Sidney No. 1 Lake Park',
    },
    {
      key: '4',
      // name: 'Jim Red',
      // age: 32,
      usrInfo: {name: '이순신', age: 32},
      address: 'London No. 2 Lake Park',
    },
  ];

  const [searchedColumn, setSearchedColumn] = useState('');
  const [searchText, setSearchText] = useState('');

  const getColumnSearchProps = dataIndex => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          // ref={node => {
          //   searchInput = node;
          // }}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button onClick={() => handleReset(clearFilters)} size="small" style={{ width: 90 }}>
            Reset
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({ closeDropdown: false });
              setSearchedColumn(dataIndex);
              setSearchText(selectedKeys[0]);
            }}
          >
            Filter
          </Button>
        </Space>
      </div>
    ),
    filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    onFilter: (value, record) =>
    {
      return get(record, dataIndex)
        .toString()
        .toLowerCase()
        .includes(value.toLowerCase());
    },

      // record[dataIndex]
      //   ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
      //   : '',

    render: text => 
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      ),
  });

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    console.log(selectedKeys);
    console.log(confirm);
    console.log(dataIndex);
    confirm();
    setSearchedColumn(['usrInfo', 0, 'age']);
    setSearchText(selectedKeys[0]);
  };

  const handleReset = clearFilters => {
    clearFilters();
    setSearchText(searchText);    
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: ['usrInfo', 'name'],
      key: 'name',
      width: '30%',
      ...getColumnSearchProps(['usrInfo', 'name']),
    },
    {
      title: 'Age',
      dataIndex: ['usrInfo', 'age'],
      key: 'age',
      width: '20%',
      ...getColumnSearchProps(['usrInfo', 'age']),
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      ...getColumnSearchProps('address'),
      sorter: (a, b) => a.address.length - b.address.length,
      sortDirections: ['descend', 'ascend'],
    },
  ];

  return <Table columns={columns} dataSource={data} />;
  
}

export default MyFolder;