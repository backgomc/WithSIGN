import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from "uuid";
import { useIntl } from 'react-intl';
import Highlighter from 'react-highlight-words';
import { Table, Input, Space, Button, Modal, Popconfirm } from 'antd';
import { ExclamationCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-layout';
import { TableDropdown } from '@ant-design/pro-table';
import axiosInterceptor from '../../config/AxiosConfig';

const { confirm } = Modal;

const UserList = () => {
  
  // console.log('UserList');
  
  const { formatMessage } = useIntl();
  const [pagination, setPagination] = useState({current:1, pageSize:10, showSizeChanger: true});
  const [loading, setLoading] = useState(false);
  const [searchedColumn, setSearchedColumn] = useState('');
  const [syncOrgPopup, setSyncOrgPopup] = useState(false);
  const [syncUsrPopup, setSyncUsrPopup] = useState(false);
  const [data, setData] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchOrg, setSearchOrg] = useState('');
  // const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  // const [hasSelected, setHasSelected] = useState(selectedRowKeys.length > 0);
  
  const handleTableChange = (pagination, filters, sorter) => {
    console.log('handleTableChange called');
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
    render: text =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[setSearchText(searchText)]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      ),
  });

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchedColumn(selectedKeys[0]);
    setSearchedColumn(dataIndex);
    if (dataIndex==='name') setSearchName(selectedKeys[0]);
    if (dataIndex==='org') setSearchOrg(selectedKeys[0]);
  }

  const handleReset = (clearFilters, dataIndex) => {
    clearFilters();
    setSearchText('');
    if (dataIndex==='name') setSearchName('');
    if (dataIndex==='org') setSearchOrg('');
  }

  const fetch = async (params = {}) => {
    setLoading(true);
    axiosInterceptor.post('/admin/user/list', params).then(response => {
      if (response.data.success) {
        const users = response.data.users;
        setPagination({...params.pagination, total:response.data.total});
        setData(users);
        setLoading(false);
      } else {
        setLoading(false);
        console.log(response.data.error);
      }
    });
  };

  const fetchUpdate = async (key, record) => {
    setLoading(true);
    let param = {
      k: key,
      i: record._id
    }
    axiosInterceptor.post('/admin/user/update', param).then(response => {
      // alert(' 결과 : ' + response.data.success);
      fetch({
        name: [searchName],
        org: [searchOrg],
        pagination
      });
    });
  };

  const fetchSendPush = async (record) => {
    console.log(record);
    setLoading(true);
    let param = {
      recvInfo: record._id,
      title: '테스트 알림 전송',
      content: '전자서명시스템에서 보낸 테스트 알림입니다.',
      thumbnail: record.thumbnail
    }
    axiosInterceptor.post('/admin/user/sendPush', param).then(response => {
      alert('테스트 알림(아이프로넷 쪽지/With 메시지) 전송 결과 : ' + response.data.success);
      setLoading(false);
    });
  };

  const syncOrg = async () => {
    setSyncOrgPopup(false);
    setLoading(true);
    const res = await axiosInterceptor.post('/admin/org/sync');
    console.log(res);
    if (res && res.data && res.data.success && res.data.success === true) {
      // 성공
    } else {
      alert('ERP 부서 정보로 갱신 실패');
    }
    fetch({ pagination });
  }

  const syncUsr = async () => {
    setSyncUsrPopup(false);
    setLoading(true);
    const res = await axiosInterceptor.post('/admin/user/sync');
    console.log(res);
    if (res && res.data && res.data.success && res.data.success === true) {
      // 성공
    } else {
      alert('ERP 직원 정보로 갱신 실패');
    }
    fetch({ pagination });
  }

  const initPasswd = async (key, record) => {
    confirm({
      title: '비밀번호를 초기화 하시겠습니까?',
      icon: <ExclamationCircleOutlined />,
      // content: '',
      okText: '네',
      okType: 'danger',
      cancelText: '아니오',
      onOk() {
        fetchUpdate(key, record);
      },
      onCancel() {
        console.log('Cancel');
      }
    });
  }

  const authority = async (key, record) => {
    confirm({
      title: '관리자 권한을 변경 처리 하시겠습니까?',
      icon: <ExclamationCircleOutlined />,
      // content: '',
      okText: '네',
      okType: 'danger',
      cancelText: '아니오',
      onOk() {
        fetchUpdate(key, record);
      },
      onCancel() {
        console.log('Cancel');
      }
    });
  }

  const setStatus = async (key, record) => {
    confirm({
      title: '사용자 상태를 변경 처리 하시겠습니까?',
      icon: <ExclamationCircleOutlined />,
      // content: '',
      okText: '네',
      okType: 'danger',
      cancelText: '아니오',
      onOk() {
        fetchUpdate(key, record);
      },
      onCancel() {
        console.log('Cancel');
      }
    });
  }

  const sendPush = async (record) => {
    confirm({
      title: '테스트 알림(아이프로넷 쪽지/With 메시지) 전송 하시겠습니까?',
      icon: <ExclamationCircleOutlined />,
      // content: '',
      okText: '네',
      okType: 'danger',
      cancelText: '아니오',
      onOk() {
        fetchSendPush(record);
      },
      onCancel() {
        console.log('Cancel');
      }
    });
  }

  const selectAction = async (key, record) => {
    if (key === 'init') {
      initPasswd(key, record);
    }
    if (key === 'flag') {
      setStatus(key, record);
    }
    if (key === 'auth') {
      authority(key, record);
    }
    if (key === 'push') {
      sendPush(record);
    }
  }

  const columns = [
    {
      title: '사번',
      dataIndex: 'SABUN',
      responsive: ['sm'],
      align: 'center',
      sorter: true
    },
    {
      title: '이름',
      dataIndex: 'name',
      key: 'name',
      ...getColumnSearchProps('name'),
      align: 'center',
      sorter: true
    },
    {
      title: '상태',
      render: (row) => {
        return (
          !row['use']?<font color='red'>미사용</font>:row['role']>0?<font color='blue'>관리자</font>:''
        );
      },
      align: 'center'
    },
    {
      title: '소속',
      key: 'org',
      ...getColumnSearchProps('org'),
      render: (row) => {
        return (row['orgInfo'].length>0?<font>{row['orgInfo'][0]['DEPART_NAME']}</font>:'');
      },
      align: 'center'
    },
    {
      title: '직명',
      key: 'JOB_TITLE',
      dataIndex: 'JOB_TITLE',
      align: 'center',
      sorter: true
    },
    {
      title: '관리',
      valueType: 'option',
      render: (text, record, _, action) => [
        <TableDropdown
          key="actionGroup"
          // onSelect={() => {console.log(text);action?.reload();}}
          onSelect={(key) => selectAction(key, record)}
          menus={[
            { key: 'init', name: '비밀번호 초기화' },
            { key: 'flag', name: '사용자 상태 변경' },
            { key: 'auth', name: '관리자 권한 변경' },
            { key: 'push', name: '테스트 알림 전송' }
          ]}
        />,
      ],
      align: 'center'
    }
  ];

  // const rowSelection = {
  //   selectedRowKeys,
  //   onChange : selectedRowKeys => {
  //     // console.log('selectedRowKeys changed: ', selectedRowKeys);
  //     setSelectedRowKeys(selectedRowKeys);
  //     setHasSelected(selectedRowKeys.length > 0);
  //   }
  // };

  useEffect(() => {
    console.log('useEffect called');
    fetch({
      pagination
    });

    return () => setLoading(false);
  }, []);

  return (
    <div>
      <PageContainer
        ghost
        header={{
          title: formatMessage({id: 'user.manage'}),
          ghost: false,
          breadcrumb: {
            routes: [
              
            ],
          },
          extra: [           
            <Popconfirm title="수동으로 ERP 부서 정보로 갱신하시겠습니까？" okText="네" cancelText="아니오" visible={syncOrgPopup} onConfirm={syncOrg} onCancel={() => {setSyncOrgPopup(false);}}>
              <Button key={uuidv4()} type="primary" danger onClick={()=>{setSyncOrgPopup(true);}}>
                부서 동기화
              </Button>
            </Popconfirm>,
            <Popconfirm title="수동으로 ERP 직원 정보로 갱신하시겠습니까？" okText="네" cancelText="아니오" visible={syncUsrPopup} onConfirm={syncUsr} onCancel={() => {setSyncUsrPopup(false);}}>
              <Button key={uuidv4()} type="primary" danger onClick={()=>{setSyncUsrPopup(true);}}>
                직원 동기화
              </Button>
            </Popconfirm>
          ]
        }}
        // content={description}
        // footer={[
        // ]}
      >
        <br></br>
        <Table
          rowKey={ item => { return item._id } }
          columns={columns}
          dataSource={data}
          pagination={pagination}
          loading={loading}
          // rowSelection={rowSelection}
          onChange={handleTableChange}
        />
      </PageContainer>
    </div>
  );
};

export default UserList;
