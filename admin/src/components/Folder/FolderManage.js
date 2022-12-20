import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useIntl } from 'react-intl';
import Highlighter from 'react-highlight-words';
import { Table, Input, Space, Button, Modal, TreeSelect, Switch, Typography, Tooltip } from 'antd';
import { FolderOpenOutlined, SearchOutlined, TeamOutlined, FileOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-layout';
import { TableDropdown } from '@ant-design/pro-table';
import axiosInterceptor from '../../config/AxiosConfig';

const { SHOW_PARENT } = TreeSelect;

const FolderManage = () => {
  
  const { formatMessage } = useIntl();
  const [pagination, setPagination] = useState({current:1, pageSize:10, showSizeChanger: true});
  const [loading, setLoading] = useState(false);
  const [searchedColumn, setSearchedColumn] = useState('');
  const [searchText, setSearchText] = useState('');
  const [data, setData] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [orgList, setOrgList] = useState([]);
  const [filters, setFilters] = useState({});
  const [sorter, setSorter] = useState({});
  const [users, setUsers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [ownerTreeValue, setOwnerTreeValue] = useState();
  const [ownerTreeData, setOwnerTreeData] = useState();
  const [ownerModal, setOwnerModal] = useState(false);
  const [shareTreeValue, setShareTreeValue] = useState();
  const [shareTreeData, setShareTreeData] = useState();
  const [shareModal, setShareModal] = useState(false);
  const [editable, setEditable] = useState(false);
  
  const ownerTreeProps = {
    treeData: ownerTreeData,
    value: ownerTreeValue,
    onChange: (value) => {setOwnerTreeValue(value);},
    treeCheckable: false,
    showSearch: true,
    showArrow: true,
    showCheckedStrategy: SHOW_PARENT,
    placeholder: '임직원 검색',
    size: 'middle',
    style: {
      width: '90%',
      marginTop: '10px'
    },
  };

  const shareTreeProps = {
    treeData: shareTreeData,
    value: shareTreeValue,
    onChange: (value) => {setShareTreeValue(value);},
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

  // 생성자 수정
  const updateOwner = async () => {
    let param = {
      folderId: selectedRowKeys,
      usrId: ownerTreeValue.split('|')[0]
    }
    const res = await axiosInterceptor.post('/admin/folder/update/owner', param);
    if (res.data.success) {
      alert('생성자 변경 성공');
    } else {
      alert('생성자 변경 실패');
    }
    setSelectedRowKeys([]);
    setOwnerModal(false);
    fetch({
      sortField: sorter.field,
      sortOrder: sorter.order,
      pagination,
      ...filters
    });
  }

  // 공유자 수정
  const updateShare = async () => {
    setLoading(true);
    let params = {
      folderId: selectedRowKeys,
      editable: editable,
      targets: shareTreeValue
    }
    const res = await axiosInterceptor.post('/admin/folder/update/share', params);
    if (res.data.success) {
      alert('공유자 변경 성공');
    } else {
      alert('공유자 변경 실패');
    }
    setSelectedRowKeys([]);
    setShareModal(false);
    fetch({
      sortField: sorter.field,
      sortOrder: sorter.order,
      pagination,
      ...filters
    });
  }

  const handleTableChange = (pagination, filters, sorter) => {
    console.log('handleTableChange called');
    setFilters(filters);
    setSorter(sorter);
    fetch({
      sortField: sorter.field,
      sortOrder: sorter.order,
      pagination,
      ...filters
    });
  };

  const getColumnSearchProps = dataIndex => ({

    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={e => {e.stopPropagation();handleSearch(selectedKeys, confirm, dataIndex);}}
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
          <Button key={uuidv4()} onClick={() => handleReset(clearFilters, confirm, dataIndex)} size="small" style={{ width: 90 }}>
            초기화
          </Button>
        </Space>
      </div>
    ),
    filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
  });

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    setSearchedColumn(dataIndex);
    setSearchText(selectedKeys[0]);
    confirm();
  }

  const handleReset = (clearFilters, confirm) => {
    clearFilters();
    setSearchText(searchText);
    confirm();
  }

  // 전체부서 트리 구조 조회
  const fetchTreeSelect = async () => {
    let users = [];
    let resp = await axiosInterceptor.post('/admin/user/tree');
    if (resp.data.success) {
      users = resp.data.users;
      setUsers(resp.data.users);
    }
    resp = await axiosInterceptor.post('/admin/org/list');
    if (resp.data.success) {
      let orgs = resp.data.orgs;
      setOrgs(orgs);
      
      let tree = [];
      const level1 = orgs.filter(e => e.PARENT_NODE_ID === '');
      level1.forEach(org => {
        let org1 = {value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: [], selectable: false}
        insertOwnerUser(org1, users, org.DEPART_CODE);
        let level2 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
        if (level2) callRecursive(org1, level2, users, orgs)
        tree.push(org1)
      });
      setOwnerTreeData(tree);

      tree = [];
      level1.forEach(function(org) {
        let level2 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
        let org1 = {value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
        insertShareUser(org1, users, org.DEPART_CODE);
        level2.forEach(function(org) {
          let org2 = {value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
          insertShareUser(org2, users, org.DEPART_CODE);
          let level3 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
          level3.forEach(function(org) {
            let org3 = {value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
            insertShareUser(org3, users, org.DEPART_CODE);
            let level4 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
            level4.forEach(function(org) {
              let org4 = {value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
              insertShareUser(org4, users, org.DEPART_CODE);
              let level5 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
              level5.forEach(function(org) {
                let org5 = {value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
                insertShareUser(org5, users, org.DEPART_CODE);
                let level6 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
                level6.forEach(function(org) {
                  let org6 = {value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
                  insertShareUser(org6, users, org.DEPART_CODE);
                  let level7 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
                  level7.forEach(function(org) {
                    let org7 = {value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
                    insertShareUser(org7, users, org.DEPART_CODE);
                    let level8 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
                    level8.forEach(function(org) {
                      let org8 = {value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
                      insertShareUser(org8, users, org.DEPART_CODE);
                      let level9 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
                      level9.forEach(function(org) {
                        let org9 = {value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
                        insertShareUser(org9, users, org.DEPART_CODE);
                        let level10 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
                        level10.forEach(function(org) {
                          let org10 = {value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
                          insertShareUser(org10, users, org.DEPART_CODE);
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
      setShareTreeData(tree);
    } else {
      console.log('ERROR');
    }
  };

  const callRecursive = (currentOrg, level, users, orgs) => {
    level.forEach(org => {
      let current = {value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: [], selectable: false}
      insertOwnerUser(current, users, org.DEPART_CODE);
      currentOrg.children?.push(current);
      let subLevel = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE)
      if (subLevel && subLevel.length > 0) callRecursive(current, subLevel, users, orgs);
    });
  };

  const insertOwnerUser = (org, users, depart_code) => {
    let filterUser = users.filter(e => e.DEPART_CODE === depart_code);
    filterUser.map(user => (
      org.children.push({value: user._id + '|' + user.SABUN + '|' + user.name + (user.JOB_TITLE ? ' ' + user.JOB_TITLE : ''), title: user.name + (user.JOB_TITLE ? ' ' + user.JOB_TITLE : '')})
    ));
  };

  const insertShareUser = (org, users, depart_code) => {
    let filterUser = users.filter(e => e.DEPART_CODE === depart_code);
    filterUser.map(user => (
      org.children.push({value: user.SABUN + '|' + user.name + (user.JOB_TITLE ? ' ' + user.JOB_TITLE : ''), title: user.name + (user.JOB_TITLE ? ' ' + user.JOB_TITLE : '')})
    ));
  };

  const fetch = async (params = {}) => {
    setLoading(true);
    axiosInterceptor.post('/admin/folder/list', params).then(response => {
      if (response.data.success) {
        let folders = response.data.folders;
        setPagination({...params.pagination, total:response.data.total});
        setData(folders);
        setLoading(false);
      } else {
        setLoading(false);
        console.log(response.data.error);
      }
    });
  };

  const selectAction = async (key, record) => {
    if (key === 'owner') {
      setSelectedRowKeys([record._id]);
      setOwnerTreeValue(record.user._id + '|' + record.user.SABUN + '|' + record.user.name + (record.user.JOB_TITLE?' '+record.user.JOB_TITLE:'')); // 코드 기반 DISP 조립
      setOwnerModal(true);
    }
    if (key === 'share') {
      setSelectedRowKeys([record._id]);
      // 권한 표시
      setEditable(record.sharedTarget.find(e => e.editable)?true:false);
      // 코드 기반 DISP 조립
      let targetTreeValue = record.sharedTarget.map(element => {
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
      setShareTreeValue(targetTreeValue);      // setTreeValue(['A11000|경영전략부', 'P2000002|이원삼 대표이사']);
      setShareModal(true);
    }
  }

  const columns = [
    {
      title: '폴더명',
      dataIndex: 'folderName',
      sorter: true,
      key: 'folderName',
      ...getColumnSearchProps('folderName'),
      render: (text, row) =>
        <div style={{wordWrap:'break-word', wordBreak:'break-word', display:'flex', alignItems:'center'}}><FolderOpenOutlined style={{marginRight:'0.5rem'}}/>
          { searchedColumn === 'folderName' ? (
            <Highlighter
              highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
              searchWords={[searchText]}
              autoEscape
              textToHighlight={text ? text.toString() : ''}
            />
          ) : (
            text
          )}
        </div>
    },
    {
      title: '생성자',
      dataIndex: ['user', 'name'],
      sorter: false,
      key: 'name',
      ...getColumnSearchProps('name'),
      onFilter: (value, record) =>
      record['user']['name']
        ? record['user']['name'].toString().toLowerCase().includes(value.toLowerCase())
        : '',
      render: (text, row) =>
        <React.Fragment>
          { searchedColumn === 'name' ? (
            <Highlighter
              highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
              searchWords={[searchText]}
              autoEscape
              textToHighlight={text ? text + ' ' + row['user']['JOB_TITLE'] : ''}
            />
          ) : (
            text + ' ' + row['user']['JOB_TITLE']
          )}
        </React.Fragment>
    },
    {
      title: '문서',
      render: (_, row) => {
        if ( row['docs'].length > 0 ) {
          let tooltipCont = '';
          for ( let item of row['docs'] ) {
            tooltipCont = tooltipCont + '▦ ' + item['alias'] + '\n';
          }
          return <Tooltip title={tooltipCont} overlayStyle={{whiteSpace:'pre'}}><FileOutlined style={{marginRight:'0.5rem'}}/>{row['docs'][0]['alias'] + ` 외 ${row['docs'].length - 1}건`}</Tooltip>;
        } else {
          return '없음';
        }
      }
    },
    {
      title: '공유',
      render: (row) => {
        return (
          row['shared']?<TeamOutlined/>:''
        );
      },
      align: 'center'
    },
    {
      title: '관리',
      valueType: 'option',
      render: (text, record, _, action) => [
        <TableDropdown
          key="actionGroup"
          onSelect={(key) => selectAction(key, record)}
          menus={[
            { key: 'owner', name: '생성자 변경' },
            { key: 'share', name: '공유자 변경' }
          ]}
        />,
      ],
      align: 'center'
    }
  ];

  useEffect(() => {
    fetchTreeSelect();
    fetch({
      pagination
    });
    return () => {
      setSearchText('');
      setSearchedColumn('');
      setData([]);
      setPagination({current:1, pageSize:10, showSizeChanger: true});
      setLoading(false);
    } // cleanup
  }, []);

  return (
    <div>
      <PageContainer
        ghost
        header={{
          title: formatMessage({id: 'folder.manage'}),
          ghost: false,
          breadcrumb: {
            routes: [
              
            ],
          },
          
        }}        
      >
        <br></br>
        <Table
          rowKey={ item => { return item._id } }
          columns={columns}
          dataSource={data}
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
        />
    </PageContainer>
    <Modal
        open={ownerModal}
        width={480}
        title="생성자 변경"
        onCancel={()=>{setOwnerModal(false)}}
        footer={[
          <Button key={uuidv4()} type="primary" onClick={updateOwner}>
            저장
          </Button>
        ]}
    >
      <TreeSelect {...ownerTreeProps} style={{width:'100%'}} />
    </Modal>
    <Modal
        open={shareModal}
        width={480}
        title="공유자 변경"
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
        <TreeSelect {...shareTreeProps} />
      </Modal>
    </div>
  );
};

export default FolderManage;
