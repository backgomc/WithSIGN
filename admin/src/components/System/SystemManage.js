import React, { useEffect, useState } from 'react';
import axiosInterceptor from '../../config/AxiosConfig';
import * as ExcelJS from 'exceljs';
import { get } from 'lodash-es';
import { saveAs } from 'file-saver';
import { v4 as uuidv4 } from 'uuid';
import { Table, List, Card, Input, Space, Button } from 'antd';
import { PageContainer } from '@ant-design/pro-layout';
import { SearchOutlined } from '@ant-design/icons';
import { useIntl } from 'react-intl';

const SystemManage = () => {
  
  const [pagination, setPagination] = useState({showSizeChanger: true});
  const [usrStat, setUsrStat] = useState([]);
  const [docStat, setDocStat] = useState([]);
  const [docStatByUser, setDocStatByUser] = useState([]);
  const [docStatByDate, setDocStatByDate] = useState([]);
  const [searchedColumn, setSearchedColumn] = useState('');
  const [searchText, setSearchText] = useState('');
  const { formatMessage } = useIntl();
  
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

  const columnsByUser = [
    {
      title: '이름',
      dataIndex: ['usrInfo', 0, 'name'],
      key: 'name',
      ...getColumnSearchProps(['usrInfo', 0, 'name']),
      sorter: (a, b) => a.usrInfo[0]['name'].localeCompare(b.usrInfo[0]['name']),
      align: 'center'
    },
    {
      title: '부서',
      dataIndex: ['orgInfo', 0, 'DEPART_NAME'],
      key: 'DEPART_NAME',
      ...getColumnSearchProps(['orgInfo', 0, 'DEPART_NAME']),
      sorter: (a, b) => a.orgInfo[0]['DEPART_NAME'].localeCompare(b.orgInfo[0]['DEPART_NAME']),
      align: 'center'
    },
    {
      title: 'USRS - 절약 문서 (건)',
      render: (row) => {
        return <font>{row['usrInfo'][0]['docCount']}</font>
      },
      sorter: (a, b) => a.totalCount - b.totalCount
    },
    {
      title: 'USRS - 절약 종이 (장)',
      render: (row) => {
        return <font>{row['usrInfo'][0]['paperless']}</font>
      },
      sorter: (a, b) => a.totalCount - b.totalCount
    },
    {
      title: 'DOCS - 절약 문서 (건)',
      dataIndex: 'totalCount',
      key: 'totalCount',
      sorter: (a, b) => a.totalCount - b.totalCount
    },
    {
      title: 'DOCS - 절약 종이 (장)',
      dataIndex: 'totalPage',
      key: 'totalPage',
      sorter: (a, b) => a.totalPage - b.totalPage
    }
  ]

  const columnsByDate = [
    {
      title: '년 월',
      dataIndex: '_id',
      key: '_id',
      sorter: (a, b) => a._id.localeCompare(b._id)
    },
    {
      title: '절약 문서 (건)',
      dataIndex: 'totalCount',
      key: 'totalCount',
      sorter: (a, b) => a.totalCount - b.totalCount
    },
    {
      title: '절약 종이 (장)',
      dataIndex: 'totalPage',
      key: 'totalPage',
      sorter: (a, b) => a.totalPage - b.totalPage
    }
  ];
  const fetch = () => {
    axiosInterceptor.post('/admin/statistic').then(response => {
      setUsrStat(response.data.usrStat);
      setDocStat(response.data.docStat);
      setDocStatByUser(response.data.docStatByUser);
      setDocStatByDate(response.data.docStatByDate);
    }).catch(error => { console.log(error); });
  };

  useEffect(() => {
    fetch();
    return () => {} // cleanup
  }, []);

  // return (
  //   <div>
  //       SystemManage
  //   </div>
  // );
  const handleExcel = async () => { 
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('My Sheet');
    
    // sheet 데이터 설정
    worksheet.columns = [
      { header: 'Id', key: 'id', width: 10 },
      { header: 'Name', key: 'name', width: 32 },
      { header: 'D.O.B.', key: 'DOB', width: 10, outlineLevel: 1 }
    ];
    
    worksheet.addRow({ id: 1, name: 'John Doe', dob: new Date(1970, 1, 1) });
    worksheet.addRow({ id: 2, name: 'Jane Doe', dob: new Date(1965, 1, 7) });
    
    // 다운로드
    const mimeType = { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], mimeType);
    saveAs(blob, 'testExcel.xlsx');
  };
  
  return (
    <div>
      <PageContainer
        ghost
        header={{
          title: formatMessage({id: 'system.manage'}),
          ghost: false,
          breadcrumb: {
            routes: [
              
            ],
          },
        }}
      >
        <br></br>
        <List
          grid={{ gutter: 16, column: 2 }}
          dataSource={docStat}
          renderItem={item => (
            <List.Item>
              <Card title="documents collection">절약 문서 {item.totalCount}건<br/>절약 종이 {item.totalPage}장</Card>
            </List.Item>
          )}
        />
        <Table columns={columnsByDate} dataSource={docStatByDate} pagination={pagination} onChange={setPagination}/>
        <List
          grid={{ gutter: 16, column: 2 }}
          dataSource={usrStat}
          renderItem={item => (
            <List.Item>
              <Card title="users collection">절약 문서 {item.totalCount}건<br/>절약 종이 {item.totalPage}장</Card>
            </List.Item>
          )}
        />
        <Table columns={columnsByUser} dataSource={docStatByUser} pagination={pagination} onChange={setPagination}/>
        <button onClick={handleExcel}>엑셀 내보내기!!</button>
      </PageContainer>
    </div>
  );
};

export default SystemManage;
