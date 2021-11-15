import React, { useEffect, useState } from 'react';
import axiosInterceptor from '../../config/AxiosConfig';
import { PageContainer } from '@ant-design/pro-layout';
import { Table, Tag, Space } from 'antd';
import { useIntl } from 'react-intl';

const UserList = () => {

  const [pagination, setPagination] = useState({current:1, pageSize:10});
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  const { formatMessage } = useIntl();

  const handleTableChange = (pagination, filters, sorter) => {
    console.log('handleTableChange called');
    fetch({
      sortField: sorter.field,
      sortOrder: sorter.order,
      pagination,
      ...filters
    });
  };

  const fetch = async (params = {}) => {
    console.log(0);
    setLoading(true);
    axiosInterceptor.post('/api/admin/user/list', params).then(response => {
      console.log(2);
      if (response.data.success) {
        const docs = response.data.documents;
        setPagination({...params.pagination, total:response.data.total});
        setData(docs);
        setLoading(false);
      } else {
          setLoading(false);
          console.log(response.data.error);
      }
    });
  };

  const columns = [
    {
      title: '사번',
      dataIndex: 'SABUN',
      responsive: ['sm'],
      sorter: true
    },
    {
      title: '이름',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '소속',
      render: (row) => {
        return (row['orgInfo'].length>0?<font color='#787878'>{row['orgInfo'][0]['DEPART_NAME']}</font>:'');
      } 
    },
    {
      title: '직명',
      key: 'JOB_TITLE',
      dataIndex: 'JOB_TITLE',
    },
    {
      title: '패스워드 초기화',
      key: 'action',
      render: (text, record) => (
        <Space size="middle">
          <a>Invite {record.name}</a>
          <a>Delete</a>
        </Space>
      ),
    },
  ];
  
  useEffect(() => {
    console.log('useEffect called');
    fetch({
      pagination
    });

  // eslint-disable-next-line react-hooks/exhaustive-deps
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
          onChange={handleTableChange}
        />

      </PageContainer>
    </div>
  );
};

export default UserList;