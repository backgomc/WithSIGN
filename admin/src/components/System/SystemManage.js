import React, { useEffect, useState } from 'react';
import axiosInterceptor from '../../config/AxiosConfig';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Table, List, Card } from 'antd';
import { PageContainer } from '@ant-design/pro-layout';
import { useIntl } from 'react-intl';

const SystemManage = () => {
  
  const [usrStat, setUsrStat] = useState([]);
  const [docStat, setDocStat] = useState([]);
  const [docStatByUser, setDocStatByUser] = useState([]);
  const [docStatByDate, setDocStatByDate] = useState([]);
  const { formatMessage } = useIntl();

  const columnsByUser = [
    {
      title: '이름',
      render: (row) => {
        return <font>{row['usrInfo'][0]['name']}</font>
      }
    },
    {
      title: 'USRS - 절약 문서 (건)',
      render: (row) => {
        return <font>{row['usrInfo'][0]['docCount']}</font>
      }
    },
    {
      title: 'USRS - 절약 종이 (장)',
      render: (row) => {
        return <font>{row['usrInfo'][0]['paperless']}</font>
      }
    },
    {
      title: 'DOCS - 절약 문서 (건)',
      dataIndex: 'totalCount',
      key: 'totalCount'
    },
    {
      title: 'DOCS - 절약 종이 (장)',
      dataIndex: 'totalPage',
      key: 'totalPage'
    }
  ]

  const columnsByDate = [
    {
      title: '년 월',
      dataIndex: '_id',
      key: '_id'
    },
    {
      title: '절약 문서 (건)',
      dataIndex: 'totalCount',
      key: 'totalCount'
    },
    {
      title: '절약 종이 (장)',
      dataIndex: 'totalPage',
      key: 'totalPage'
    }
  ];

  const fetch = () => {
    axiosInterceptor.post('/admin/statistic').then(response => {
      console.log(response.data);
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
        <Table columns={columnsByDate} dataSource={docStatByDate}/>
        <List
          grid={{ gutter: 16, column: 2 }}
          dataSource={usrStat}
          renderItem={item => (
            <List.Item>
              <Card title="users collection">절약 문서 {item.totalCount}건<br/>절약 종이 {item.totalPage}장</Card>
            </List.Item>
          )}
        />
        <Table columns={columnsByUser} dataSource={docStatByUser}/>
        <button onClick={handleExcel}>엑셀 내보내기!!</button>
      </PageContainer>
    </div>
  );
};

export default SystemManage;
