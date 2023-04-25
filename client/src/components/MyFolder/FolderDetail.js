import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../app/infoSlice';
import { setDocToView } from '../ViewDocument/ViewDocumentSlice';
import { navigate } from '@reach/router';
import { get } from 'lodash-es';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import axiosInterceptor from '../../config/AxiosConfig';
import Moment from 'react-moment';
import 'moment/locale/ko';
import { setPathname } from '../../config/MenuSlice';
import { DOCUMENT_SIGNED } from '../../common/Constants';
import { Tooltip, Modal, Input, Space, Button, message, Typography, Table, Radio, Badge, Tabs, List, TreeSelect, Switch, Empty, Select, Divider } from 'antd';
import { SearchOutlined, TeamOutlined, FileOutlined, ArrowLeftOutlined, AppstoreOutlined , EllipsisOutlined, UnorderedListOutlined , DownloadOutlined, CheckCircleTwoTone, FolderOpenFilled, FolderOpenTwoTone, SwapOutlined, DeleteOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-layout';
import ProCard from '@ant-design/pro-card';
import RcResizeObserver from 'rc-resize-observer';
import 'antd/dist/antd.css';
import '@ant-design/pro-list/dist/list.css';
import '@ant-design/pro-card/dist/card.css';
import '@ant-design/pro-form/dist/form.css';
import styled from 'styled-components';

const CardTitle  = styled.div`
  width: 190px;
  line-height: 1.2em;
  text-align: center;
  text-overflow: ellipsis;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
`;

const TextTitle = styled.div`
  text-overflow: ellipsis;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
`;

const { SHOW_PARENT } = TreeSelect;

const FolderDetail = ({location}) => {
  
  const user = useSelector(selectUser);
  const { _id } = user;
  const dispatch = useDispatch();
  const backUrl = location.state.backUrl;
  const folderInfo = location.state.folderInfo;
  const folderId = folderInfo._id;
  const [docs, setDocs] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [hasSelected, setHasSelected] = useState(selectedRowKeys.length > 0);
  const [users, setUsers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [myOrgs, setMyOrgs] = useState();
  const [treeValue, setTreeValue] = useState();
  const [treeData, setTreeData] = useState();
  const [moveModal, setMoveModal] = useState(false);
  const [shareModal, setShareModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [folderList, setFolderList] = useState([]);
  const [moveFolderId, setMoveFolderId] = useState();
  const [searchedColumn, setSearchedColumn] = useState('');
  const [searchText, setSearchText] = useState('');
  const [editable, setEditable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDownload, setLoadingDownload] = useState([]);
  const [responsive, setResponsive] = useState(false);

  const treeProps = {
    treeData,
    virtual: false,
    value: treeValue,
    onChange: (value) => {console.log(value);setTreeValue(value);},
    treeCheckable: true,
    showArrow: true,
    showCheckedStrategy: SHOW_PARENT,
    placeholder: '부서 또는 직원 검색',
    size: 'middle',
    style: {
      width: '90%',
      marginTop: '10px'
    },
  };

  const getColumnSearchProps = dataIndex => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            key={uuidv4()}
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            검색
          </Button>
          <Button key={uuidv4()} onClick={() => handleReset(clearFilters, dataIndex)} size="small" style={{ width: 90 }}>
            초기화
          </Button>
        </Space>
      </div>
    ),
    filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    onFilter: (value, record) => {
      return get(record, dataIndex).toString().toLowerCase().includes(value.toLowerCase());
    },
    render: (text) => text
  });

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchedColumn(dataIndex);
    setSearchText(selectedKeys[0]);
  }

  const handleReset = (clearFilters, dataIndex) => {
    clearFilters();
    setSearchText(searchText);
  }

  const onChangeDocTitle = (text, item) => {
    if (text === item.docTitle) return false;
    setLoading(true);
    let params = {
      _id: folderId,
      user: _id,
      docId: item._id,
      docTitle: text
    }
    axiosInterceptor.post('/api/folder/renameDocTitle', params).then(response => {
      console.log(response.data);
      if (response.data.success) {
        fetchDocs({
          user: _id,
          _id: folderId
        });
        setSelectedRowKeys([]);
        setHasSelected(false);
      } else {
        message.success({content: '권한이 없습니다.', style: {marginTop: '70vh'}});
      }
      setLoading(false);
    });
  }

  // 폴더 선택
  const selectFolder = (key) => {
    navigate('/inFolder', {state: {folderInfo: folderList.find(e => e._id === key), backUrl: backUrl}});
    fetchDocs({
      user: _id,
      _id: key
    });
  };

  const columns = [
    {
      title: '문서명',
      dataIndex: 'docTitle',
      sorter: true,
      key: 'docTitle',
      ...getColumnSearchProps(['docTitle']),
      sorter: (a, b) => a.docTitle?.localeCompare(b.docTitle),
      render: (text, row) => {
        return (
          <Space>
            <FileOutlined />
              <Tooltip placement="top" title={'[원문서] ' + row.originTitle}>
              {
                folderInfo.user._id === _id || folderInfo.sharedTarget.find(item => item.editable && myOrgs && myOrgs.find(e => e === item.target)) ?
                <Typography.Title editable={{onChange: (text) => {onChangeDocTitle(text, row)}, tooltip: false}} level={5} style={{ margin: 0 }} >{text}</Typography.Title>
                :
                text
              }
              </Tooltip>
          </Space>
        )
      }
    },
    {
      title: '생성 일시',
      dataIndex: 'requestedTime',
      sorter: true,
      key: 'requestedTime',
      width: '180px',
      sorter: (a, b) => a.requestedTime?.localeCompare(b.requestedTime),
      render: (text, row) => {
        return <Moment format="YYYY/MM/DD HH:mm">{row['requestedTime']}</Moment>
      }
    },
    {
      title: '수정 일시',
      dataIndex: 'recentTime',
      sorter: true,
      defaultSortOrder: 'descend',
      key: 'recentTime',
      width: '180px',
      sorter: (a, b) => a.recentTime?.localeCompare(b.recentTime),
      render: (text, row) => {
        return <Moment format="YYYY/MM/DD HH:mm">{row['recentTime']}</Moment>
      }
    },
    {
      title: '',
      dataIndex: '',
      width: '100px',
      render: (text, row) => {
        return (
          <Space>
            <Tooltip placement="top" title={'문서 보기'}>
              <Button
                key={uuidv4()}
                icon={<FileOutlined />}
                  onClick={
                    () => {
                      const docId = row['_id'];
                      const docRef = row['docRef'];
                      const docType = row['docType'];
                      const docTitle = row['docTitle'];
                      const downloads = row['downloads'];
                      const status = row['signed'] ? DOCUMENT_SIGNED : '';
                      const isWithPDF = true;
                      dispatch(setDocToView({ docRef, docId, docType, docTitle, status, downloads, isWithPDF }));
                      navigate('/viewDocument');
                    }
                  }
              ></Button>
            </Tooltip>
            { row['signed'] ?
            (<Tooltip placement="top" title={'다운로드'}>
              <Badge count={row['downloads'].find(e => e === _id)?<CheckCircleTwoTone/>:0}>
                <Button
                  key={uuidv4()}
                  href={'/api/storage/documents/'+row['_id']} download={row['docTitle']+'.pdf'}
                  icon={<DownloadOutlined />}
                  loading={loadingDownload[row['_id']]}
                  onClick={(e) => {
                    row['downloads'].push(_id);
                    axiosInterceptor.post('/api/document/updateDownloads', {docId:row['_id'], usrId:_id});
                    setLoadingDownload( { [row['_id']] : true } );
                    setTimeout(() => {
                      setLoadingDownload( { [row['_id']] : false } );
                    }, 3000);
                  }}
                ></Button>
              </Badge>
            </Tooltip>) : (<></>)}
          </Space>
        )
      }
    }
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange : selectedRowKeys => {
      console.log('selectedRowKeys changed: ', selectedRowKeys);
      setSelectedRowKeys(selectedRowKeys);
      setHasSelected(selectedRowKeys.length > 0);
    }
  };

  // 폴더 이동 InputRadio State
  const onChangeMoveFolder = e => {
    console.log('radio checked', e.target.value);
    setMoveFolderId(e.target.value);
  }

  // 폴더 이동
  const moveFolder = () => {
    if (moveFolderId === '') {
      message.info({content: '폴더를 선택하세요.', style: {marginTop: '70vh'}});
      return false;
    }
    setLoading(true);
    let params = {
      user: _id,
      sourceId: folderId,
      targetId: moveFolderId,
      docIds: selectedRowKeys
    }
    
    axiosInterceptor.post('/api/folder/moveDocInFolder', params).then(response => {
      console.log(response.data);
      if (response.data.success) {
        fetchDocs({
          user: _id,
          _id: folderId
        });
        setSelectedRowKeys([]);
        setHasSelected(false);
      } else {
        message.success({content: '권한이 없습니다.', style: {marginTop: '70vh'}});
      }
      setMoveModal(false);
      setLoading(false);
    });
  }

  const removeDocInFolder = (text, item) => {
    setLoading(true);
    let params = {
      user: _id,
      sourceId: folderId,
      docIds: selectedRowKeys
    }
    axiosInterceptor.post('/api/folder/removeDocInFolder', params).then(response => {
      console.log(response.data);
      if (response.data.success) {
        fetchDocs({
          user: _id,
          _id: folderId
        });
        setSelectedRowKeys([]);
        setHasSelected(false);
      } else {
        message.success({content: '권한이 없습니다.', style: {marginTop: '70vh'}});
      }
      setDeleteModal(false);
      setLoading(false);
    });
  }

  // 공유 Modal Show
  const onClickShare = () => {
    // 코드 기반 DISP 조립
    let f = folderList.find(item => item._id === folderId);
    let targetTreeValue = f.sharedTarget.map(element => {
      let disp = '';
      let data = orgs.find(e => e.DEPART_CODE === element.target);
      if (data) {
        disp = '|' + data.DEPART_NAME;
      } else {
        data = users.find(e => e.SABUN === element.target);
        if (data) disp = '|' + data.name + (data.JOB_TITLE?' '+data.JOB_TITLE:'');
      } 
      return element.target + disp;
    });
    setTreeValue(targetTreeValue);      // setTreeValue(['A11000|경영전략부', 'P2000002|이원삼 대표이사']);

    // 권한 표시
    setEditable(f.sharedTarget.find(e => e.editable)?true:false);
    
    setShareModal(true);
  };

  // 공유 설정
  const updateShare = () => {
    setLoading(true);
    let params = {
      _id: folderId,
      user: _id,
      includeOption: true,
      editable: editable,
      targets: treeValue
    }
    axiosInterceptor.post('/api/folder/shareFolder', params).then(response => {
      console.log(response.data);
      if (response.data.success) {
        fetchFolders(params);
      } else {
        message.success({content: '권한이 없습니다.', style: {marginTop: '70vh'}});
      }
      setShareModal(false);
      setLoading(false);
    });
  }

  // 전체부서 트리 구조 조회
  const fetchTreeSelect = async (params = {}) => {
    let users = [];
    let resp = await axiosInterceptor.post('/api/users/list', params);
    if (resp.data.success) {
      users = resp.data.users;
      setUsers(resp.data.users);
    }
    resp = await axiosInterceptor.post('/api/users/orgList', params);
    if (resp.data.success) {
      let orgs = resp.data.orgs;
      let tree = [];
      setOrgs(orgs);

      let level1 = orgs.filter(e => e.PARENT_NODE_ID === '');
      level1.forEach(function(org) {
        let level2 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
        let org1 = {key: org.DEPART_CODE, value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
        insertUser(org1, users, org.DEPART_CODE);

        level2.forEach(function(org) {
          let org2 = {key: org.DEPART_CODE, value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
          insertUser(org2, users, org.DEPART_CODE);

          let level3 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
          level3.forEach(function(org) {
            let org3 = {key: org.DEPART_CODE, value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
            insertUser(org3, users, org.DEPART_CODE);

            let level4 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
            level4.forEach(function(org) {
              let org4 = {key: org.DEPART_CODE, value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
              insertUser(org4, users, org.DEPART_CODE);
              
              let level5 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
              level5.forEach(function(org) {
                let org5 = {key: org.DEPART_CODE, value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
                insertUser(org5, users, org.DEPART_CODE);

                let level6 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
                level6.forEach(function(org) {
                  let org6 = {key: org.DEPART_CODE, value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
                  insertUser(org6, users, org.DEPART_CODE);
                
                  let level7 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
                  level7.forEach(function(org) {
                    let org7 = {key: org.DEPART_CODE, value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
                    insertUser(org7, users, org.DEPART_CODE);

                    let level8 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
                    level8.forEach(function(org) {
                      let org8 = {key: org.DEPART_CODE, value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
                      insertUser(org8, users, org.DEPART_CODE);

                      let level9 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
                      level9.forEach(function(org) {
                        let org9 = {key: org.DEPART_CODE, value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
                        insertUser(org9, users, org.DEPART_CODE);

                        let level10 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
                        level10.forEach(function(org) {
                          let org10 = {key: org.DEPART_CODE, value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
                          insertUser(org10, users, org.DEPART_CODE);
                          org9.children.push(org10);
                        });
                        org8.children.push(org9);
                      });
                      org7.children.push(org8);
                    });
                    org6.children.push(org7);
                  });
                  org5.children.push(org6);
                });
                org4.children.push(org5);
              });
              org3.children.push(org4);
            });
            org2.children.push(org3);
          });
          org1.children.push(org2);
        });
        tree.push(org1);
      });
      console.log(tree);
      setTreeData(tree);
    } else {
      console.log('ERROR');
    }
  };

  const insertUser = (org, users, depart_code) => {
    let filterUser = users.filter(e => e.DEPART_CODE === depart_code);
    filterUser.map(user => (
      org.children.push({key: user._id, value: user.SABUN + '|' + user.name + (user.JOB_TITLE ? ' ' + user.JOB_TITLE : ''), title: user.name + (user.JOB_TITLE ? ' ' + user.JOB_TITLE : '')})
    ));
  };

  // 폴더별 문서 목록 조회
  const fetchDocs = (params = {}) => {
    setLoading(true);
    axiosInterceptor.post('/api/folder/selectFolder', params).then(response => {
      console.log(response.data.docs);
      setDocs(response.data.docs);
      setLoading(false);
    });
  };

  // 사용자의 부서 정보 조회
  const fetchMyOrgs = (params = {}) => {
    axiosInterceptor.post('/api/users/myOrgs', params).then(response => {
      if (response.data.success) {
        setMyOrgs(response.data.orgs);
      }
    });
  };

  // 사용자별 폴더 목록 조회  
  const fetchFolders = (params = {}) => {
    axiosInterceptor.post('/api/folder/listFolder', params).then(response => {
      console.log(response.data.folders);
      setFolderList([...response.data.folders]);
    });
  };

  useEffect(() => {
    console.log('useEffect()');

    // 좌측 메뉴 선택
    dispatch(setPathname('/myFolder'));
    
    fetchDocs({
      user: _id,
      _id: folderId
    });
    
    fetchFolders({
      user: _id,
      includeOption: true
    });

    fetchMyOrgs({
      user: _id
    });

    fetchTreeSelect({
      OFFICE_CODE: '7831'
    });

    return () => {
      setDocs([]);
      setSelectedRowKeys([]);
      setHasSelected(false);
      setUsers([]);
      setOrgs([]);
      setMyOrgs();
      setTreeValue();
      setTreeData();
      setMoveModal(false);
      setShareModal(false);
      setDeleteModal(false);
      setFolderList([]);
      setMoveFolderId();
      setSearchedColumn('');
      setSearchText('');
      setEditable(false);
      setLoading(false);
      setLoadingDownload([]);
      setResponsive(false);
    } // cleanup
  }, []);

  return (
    <div>
      <PageContainer
          ghost
          header={{
            title: (<Space>
                    {folderInfo.folderName}
                    {folderInfo.shared?
                      <Tooltip placement="top" title={(folderInfo.user._id===_id || folderInfo.sharedTarget.find(item => item.editable && myOrgs && myOrgs.find(e => e === item.target)))?'':'권한이 없습니다.'}>
                        <Button type="primary" shape="circle" icon={<TeamOutlined />} size="large" onClick={onClickShare} disabled={(folderInfo.user._id===_id || folderInfo.sharedTarget.find(item => item.editable && myOrgs && myOrgs.find(e => e === item.target)))?false:true} ></Button>
                      </Tooltip>
                      :
                      ''
                    }
                    {folderInfo.user._id!==_id?<Typography.Title type="secondary" level={5} style={{margin: 0}}>{folderInfo.user.name+' '+folderInfo.user.JOB_TITLE+'님이 공유한 폴더'}</Typography.Title>:''}
                  </Space>),
            ghost: false,
            breadcrumb: {
              routes: [],
            },
            // extra: [
            //   <Button key={uuidv4()} icon={<ArrowLeftOutlined />} onClick={() => {navigate('/myFolder');}}> 뒤로</Button>
            // ]
          }}
          content={
            <Space>
              {`선택한 문서 (${selectedRowKeys.length})`}
              <Typography.Link disabled={!hasSelected} onClick={()=>{setMoveFolderId('');setMoveModal(true);}}><FolderOpenOutlined /> 이동</Typography.Link>
              <Typography.Link disabled={!hasSelected} onClick={()=>{setDeleteModal(true);}} type="danger"><DeleteOutlined /> 삭제</Typography.Link>
            </Space>
          }
          footer={[
          ]}
      >
        <Tabs style={{marginTop: '1rem'}} defaultActiveKey="1" tabBarExtraContent={{
          left:   <Button type="text" key={uuidv4()} icon={<ArrowLeftOutlined />} onClick={() => {navigate(backUrl?backUrl:'/myFolder');}}> 뒤로</Button>,
          right:  <Select style={{ width: 200 }} value={folderId} onChange={selectFolder} >
                    {folderList.map(folder => (
                      <Select.Option key={folder._id}><Space size="small">{folder.user._id === _id ? <FolderOpenTwoTone /> : <FolderOpenFilled />}{folder.folderName}{folder.shared?<TeamOutlined/>:''}</Space></Select.Option>
                    ))}
                  </Select>
        }}>
          <Tabs.TabPane key="2" tab={ <span><AppstoreOutlined /> 아이콘</span> } >
            <RcResizeObserver
              key="resize-observer"
              onResize={(offset) => {
                setResponsive(offset.width < 1280);
              }}
            >
              <List
                rowKey="id"
                grid={{ gutter: 24, lg: 3, md: 2, sm: 1, xs: 1 }}
                dataSource={docs}
                loading={loading}
                renderItem={item => (
                  <List.Item key={item._id}>
                    <ProCard 
                      hoverable
                      bordered
                      layout="center"
                      direction="column"
                      style={{ minWidth: '180px', height: '100%' }}
                      bodyStyle={{ padding: '5px'}}
                      onClick={
                        () => {
                          const docId = item['_id'];
                          const docRef = item['docRef'];
                          const docType = item['docType'];
                          const docTitle = item['docTitle'];
                          const downloads = item['downloads'];
                          const status = item['signed'] ? DOCUMENT_SIGNED:'';
                          const isWithPDF = true;
                          dispatch(setDocToView({ docRef, docId, docType, docTitle, status, downloads, isWithPDF }));
                          navigate('/viewDocument');
                        }
                      }
                    >
                      <div style={{
                        backgroundImage: 'url('+item.thumbnail+')',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        backgroundSize: '80%',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '180px',
                        height: '180px',
                        display: 'flex'
                      }}>
                      </div>
                    </ProCard>
                    <CardTitle>
                      <Tooltip placement="top" title={'[원문서] ' + item.originTitle}>
                      {
                        folderInfo.user._id === _id || folderInfo.sharedTarget.find(item => item.editable && myOrgs && myOrgs.find(e => e === item.target)) ?
                        <Typography.Title editable={{onChange: (e) => {onChangeDocTitle(e, item)}, tooltip: false}} level={5} style={{ margin: 0 }} >{item.docTitle}</Typography.Title>
                        :
                        item.docTitle
                      }
                      </Tooltip>
                    </CardTitle>
                  </List.Item>
                )}
              />
            </RcResizeObserver>
          </Tabs.TabPane>
          <Tabs.TabPane key="1" tab={ <span><UnorderedListOutlined /> 리스트</span> } >
            <Table
              rowKey={ item => { return item._id } }
              columns={columns}
              dataSource={docs}
              loading={loading}
              rowSelection={
                folderInfo.user._id === _id || folderInfo.sharedTarget.find(item => item.editable && myOrgs && myOrgs.find(e => e === item.target)) ? rowSelection
                :
                false
              }
            />
          </Tabs.TabPane>
        </Tabs>
      </PageContainer>
      <Modal
        visible={moveModal}
        width={360}
        title="폴더 선택"
        onCancel={()=>{setMoveModal(false)}}
        footer={[
          <Button type="primary" onClick={moveFolder}>
            이동 또는 복사
          </Button>
        ]}
        bodyStyle={{textAlign: 'Center'}}
      >
        {/* <Typography.Paragraph level={5} style={{marginBottom: '1.5rem', textAlign: 'left'}}>
          <Space><FolderOpenTwoTone />개인 폴더<SwapOutlined /><FolderOpenTwoTone  />개인 폴더<EllipsisOutlined /><Typography.Text type="secondary">이동</Typography.Text></Space>
          <Space><FolderOpenTwoTone />개인 폴더<SwapOutlined /><FolderOpenFilled  />공유 받은 폴더<EllipsisOutlined /><Typography.Text type="warning">복사</Typography.Text></Space>
          <Space><FolderOpenFilled />공유 받은 폴더<SwapOutlined /><FolderOpenFilled  />공유 받은 폴더<EllipsisOutlined /><Typography.Text type="warning">복사</Typography.Text></Space>
        </Typography.Paragraph> */}
        <Radio.Group onChange={onChangeMoveFolder} value={moveFolderId} buttonStyle="solid" style={{textAlign: 'left'}}>
          <Space direction="vertical">
            {folderList && folderList.length > 0 ?
              folderList && folderList.filter(e => e._id!=='').map(folder => (
                <Radio.Button key={uuidv4()} style={{width:'100%'}} value={folder._id} disabled={(folder.user._id===_id || folder.sharedTarget.find(item => item.editable && myOrgs && myOrgs.find(e => e === item.target)))?false:true}>
                  <Tooltip placement="top" title={(folder.user._id===_id || folder.sharedTarget.find(item => item.editable && myOrgs && myOrgs.find(e => e === item.target)))?'':'권한이 없습니다.'}>
                    <Space size="small">{folder.user._id === _id ? <FolderOpenTwoTone /> : <FolderOpenFilled />}<TextTitle>{folder.folderName}</TextTitle>{folder.shared?<TeamOutlined/>:''}</Space>
                  </Tooltip>
                </Radio.Button>
              ))
            :
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span>폴더가 없습니다.</span>} style={{margin: '0'}}/>
            }
          </Space>
        </Radio.Group>
        <Typography.Paragraph level={5} style={{marginTop: '1.5rem'}}>
          <Space><FolderOpenTwoTone />개인 폴더<br/><FolderOpenFilled />공유 받은 폴더<br/><TeamOutlined />공유 표시</Space>
        </Typography.Paragraph>
      </Modal>
      <Modal
        visible={deleteModal}
        width={360}
        title="폴더에서 삭제"
        onCancel={()=>{setDeleteModal(false)}}
        footer={<Button key={uuidv4()} type="primary" danger onClick={removeDocInFolder}>삭제</Button>}
      >
        <p><Space><FolderOpenTwoTone />{folderInfo.folderName}</Space> 폴더에서 선택한 문서 {selectedRowKeys.length} 건을 삭제하시겠습니까?</p>
      </Modal>
      <Modal
        visible={shareModal}
        width={480}
        title="공유"
        onCancel={()=>{setShareModal(false)}}
        footer={[
          <Button key={uuidv4()} type="primary" onClick={updateShare}>
            저장
          </Button>
        ]}
      >
        <Space>
          <Typography.Text>공유자 권한</Typography.Text>
          <Switch
            checkedChildren="문서 수정 및 폴더 설정 가능"
            unCheckedChildren="문서 읽기만 가능"
            checked={editable}
            onChange={() => setEditable(!editable)}
          />
        </Space>
        <TreeSelect {...treeProps} />
      </Modal>
    </div>
  );
};

export default FolderDetail;
