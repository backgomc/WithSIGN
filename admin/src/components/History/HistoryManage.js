import React, { useEffect, useState } from 'react';
import axiosInterceptor from '../../config/AxiosConfig';
import { v4 as uuidv4 } from 'uuid';
import { useIntl } from 'react-intl';
import { Table, Input, Select, Space, Button, Badge } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-layout';
import { navigate } from '@reach/router';
import Moment from 'react-moment';
import 'moment/locale/ko';

const { Option } = Select;

const HistoryManage = () => {
  const { formatMessage } = useIntl();
  const [pagination, setPagination] = useState({current:1, pageSize:10, showSizeChanger: true});
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [type, setType] = useState();
  const [filters, setFilters] = useState({});
  const [sorter, setSorter] = useState({});

  const handleSelectChange = (type) => {
    console.log('handleSelectChange called');
    pagination.current = 1; // RESET
    setType(type);
    fetch({
      sortOrder: sorter.order,
      pagination,
      type,
      ...filters
    });
  };

  const handleTableChange = (pagination, filters, sorter) => {
    console.log('handleTableChange called');
    setFilters(filters);
    setSorter(sorter);
    fetch({
      sortOrder: sorter.order,
      pagination,
      type,
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
          onPressEnter={() => handleSearch(confirm)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(confirm)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            검색
          </Button>
          <Button onClick={() => handleReset(clearFilters)} size="small" style={{ width: 90 }}>
            초기화
          </Button>
        </Space>
      </div>
    ),
    filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
  });

  const handleSearch = (confirm) => {
    confirm();
  }

  const handleReset = (clearFilters) => {
    clearFilters();

  }

  const fetch = async (params = {}) => {
    setLoading(true);
    axiosInterceptor.post('/admin/history/list', params).then(response => {
      if (response.data.success) {
        let logs = response.data.logs;
        setPagination({...params.pagination, total:response.data.total});
        setData(logs);
        setLoading(false);
      } else {
        setLoading(false);
        console.log(response.data.error);
      }
    });
  };

  const columns = [
    {
      title: '유형',
      dataIndex: 'type',
      key: 'type',
      render: (value) => {
        let text = '';
        if (value === 'LOGIN') text = '로그인';
        if (value === 'SELECT') text = '조회';
        if (value === 'UPDATE') text = '수정';
        if (value === 'DELETE') text = '삭제';
        return <div>{text}</div>
      }
    },
    {
      title: 'URL',
      dataIndex: 'url',
      responsive: ['sm'],
      key: 'url'
    },
    {
      title: '요청 파라미터',
      dataIndex: 'request',
      responsive: ['sm'],
      key: 'request',
      expandable: true,
      render: (text, row) =>
        <div style={{wordWrap:'break-word', wordBreak:'break-word', display:'flex', alignItems:'center'}}>{text}</div>
    },
    {
      title: '관리자',
      dataIndex: ['user', 'name'],
      key: 'name',
      ...getColumnSearchProps('name')
    },
    {
      title: '요청시간',
      dataIndex: 'time',
      responsive: ['sm'],
      sorter: true,
      key: 'time',
      render: (text, row) => {
        return <Moment format="YYYY/MM/DD HH:mm">{row['time']}</Moment>
      }
    }
  ];

  useEffect(() => {
    console.log('useEffect called');
    setType('');
    fetch({
      pagination
    });
    return () => {
      setPagination({current:1, pageSize:10, showSizeChanger: true});
      setLoading(false);
      setData([]);
      setType('');
      setFilters({});
      setSorter({});
    } // cleanup
}, []);

  return (
    <div>
        <PageContainer
          ghost
          header={{
            title: formatMessage({id: 'history.manage'}),
            ghost: false,
            breadcrumb: {
              routes: [

              ],
            },
            extra: [           
              <Select key={uuidv4()} defaultValue={type} style={{ width: 120 }} onChange={handleSelectChange}>
                <Option value="">전체</Option>
                <Option value="LOGIN">로그인</Option>
                <Option value="SELECT">조회</Option>
                <Option value="UPDATE">수정</Option>
                <Option value="DELETE">삭제</Option>
              </Select>
            ]
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
    </div>
  );
};

export default HistoryManage;
