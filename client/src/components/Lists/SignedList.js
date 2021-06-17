import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Text, Spinner } from 'gestalt';
import { Table } from "antd";
import 'gestalt/dist/gestalt.css';
import { useSelector, useDispatch } from 'react-redux';
import { searchForDocumentsSigned } from '../../firebase/firebase';
// import { selectUser } from '../../firebase/firebaseSlice';
import { selectUser } from '../../app/infoSlice';
import { setDocToView } from '../ViewDocument/ViewDocumentSlice';
import { navigate } from '@reach/router';
import * as API from './api';
import { useFetch, useTable } from '../hooks';
import useColumn from './useColumn';
import * as ActionTypes from './actionTypes';

// import request from 'umi-request';
import ProTable, { ProColumns, ActionType } from '@ant-design/pro-table';



const SignedList = () => {

  // const dataSource = [
  //   {
  //     key: '1',
  //     name: 'Mike',
  //     age: 32,
  //     address: '10 Downing Street',
  //   },
  //   {
  //     key: '2',
  //     name: 'John',
  //     age: 42,
  //     address: '10 Downing Street',
  //   },
  // ];
  
  const columns = [
    {
      title: '요청자',
      dataIndex: 'email',
      sorter: true,
      key: 'email',
    },
    {
      title: '서명시간',
      dataIndex: 'signedTime',
      sorter: true,
      key: 'signedTime',
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
    },
  ];

  const getRandomuserParams = params => ({
    results: params.pagination.pageSize,
    page: params.pagination.current,
    ...params,
  });


  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({current:1, pageSize:10});
  const [loading, setLoading] = useState(false);

  const handleTableChange = (pagination, filters, sorter) => {
    fetch({
      email: email,
      sortField: sorter.field,
      sortOrder: sorter.order,
      pagination,
      ...filters,
    });
  };

  const fetch = (params = {}) => {
    setLoading(true);

    axios.post('/api/document/searchForDocumentsSigned', params).then(response => {

      console.log(response)
      if (response.data.success) {
        const docs = response.data.documents;

        setPagination({...params.pagination, total:response.data.total});
        setData(docs);
        setLoading(false);

      } else {
          alert(response.data.error)
      }

    });
  };
  

  const user = useSelector(selectUser);
  const { email } = user;
  const [docs, setDocs] = useState([]);
  const [show, setShow] = useState(true);
  // const [columns] = useColumn();

  const dispatch = useDispatch();

  // const [tableProps, setTableProps] = useState([]);
  // const [refresh, setRefresh] = useState([]);
  // const [oldParams, setoOldParams] = useState([]);


  useEffect(() => {

    fetch({
      email: email,
      pagination,
    });

    // (tableProps, refresh, oldParams) = useTable({
    //   getData: API.documentsSigned(param),
    //   options: {
    //     onChange: (...pageParams) => {
    //       let newParams = {...oldParams, ...API.getParams(...pageParams)};
    //       API.processParams(newParams);
    //       refresh(newParams);
    //     }
    //   }
    // });

    // axios.post('/api/document/searchForDocumentsSigned', param).then(response => {

    //   if (response.data.success) {
    //     const docs = response.data.documents;
    //     setDocs(docs);
    //     setShow(false);

    //   } else {
    //       alert(response.data.error)
    //   }

    // });

  }, [email]);

  return (
    <div>
      {/* {show ? (
        <Spinner show={show} accessibilityLabel="spinner" />
      ) : (
        <div>
          <Table dataSource={docs} columns={columns} />
        </div>
      )} */}
        <Table
          columns={columns}
          // rowKey={record => record.login.uuid}
          dataSource={data}
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
        />
    </div>
    
  );
};

export default SignedList;
