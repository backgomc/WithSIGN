import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
// import { Button, Text, Spinner } from 'gestalt';
import { Table, Input, Space, Button } from "antd";
import Highlighter from 'react-highlight-words';
import { SearchOutlined } from '@ant-design/icons';
// import 'gestalt/dist/gestalt.css';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../app/infoSlice';
import { navigate } from '@reach/router';
import { setDocToView } from '../ViewDocument/ViewDocumentSlice';
import Moment from 'react-moment';
// import * as API from './api';
// import { useFetch, useTable } from '../hooks';
// import useColumn from './useColumn';
// import * as ActionTypes from './actionTypes';

// import request from 'umi-request';
// import ProTable, { ProColumns, ActionType } from '@ant-design/pro-table';



const SignedList = () => {

  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { _id } = user;
  // const [docs, setDocs] = useState([]);
  // const [show, setShow] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({current:1, pageSize:10});
  const [loading, setLoading] = useState(false);
  const searchInput = useRef<Input>(null)

  const handleTableChange = (pagination, filters, sorter) => {
    console.log("handleTableChange called")
    console.log(filters)
    fetch({
      sortField: sorter.field,
      sortOrder: sorter.order,
      pagination,
      ...filters,
      uid: _id
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
          setLoading(false);
          alert(response.data.error)
      }

    });
  };

  const getColumnSearchProps = dataIndex => ({

    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          // ref={searchInput}
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
              setSearchText(selectedKeys[0])
              setSearchedColumn(dataIndex)
            }}
          >
            Filter
          </Button>
        </Space>
      </div>
    ),
    filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
        : '',
    onFilterDropdownVisibleChange: visible => {
      if (visible) {
        // setTimeout(() => searchInput.select(), 100);
        // setTimeout(
        //   () => searchInput && searchInput.current && searchInput.current.select()
        // )
      }
    },
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
    setSearchedColumn(selectedKeys[0])
    setSearchedColumn(dataIndex)
  }

  const handleReset = clearFilters => {
    clearFilters();
    setSearchText('');
  }
  

  const columns = [
    {
      title: '상태',
      dataIndex: 'state',
      sorter: true,
      key: 'state',
      ...getColumnSearchProps('state'),
      // render: (text,row) => <div>{text} {row["email"]} </div>, // 완료된 문서 | 취소된 문서
    },
    {
      title: '문서명',
      dataIndex: 'docTitle',
      sorter: true,
      key: 'docTitle',
      ...getColumnSearchProps('docTitle'),
      // render: (text,row) => <div>{text} {row["email"]} </div>, // 여러 필드 동시 표시에 사용
    },
    {
      title: '요청자',
      dataIndex: ['user', 'name'],
      sorter: true,
      key: 'name',
      ...getColumnSearchProps('name'),
      // render: (text,row) => <div>{text} {row["email"]} </div>, // 여러 필드 동시 표시에 사용
    },
    // {
    //   title: 'Email',
    //   dataIndex: 'email',
    //   sorter: true,
    //   key: 'email',
    //   ...getColumnSearchProps('email')
    // },
    {
      title: '서명 시간',
      dataIndex: 'signedTime',
      sorter: true,
      key: 'signedTime',
      render: (text, row) => <Moment format='YYYY/MM/DD HH:mm'>{text}</Moment>
    },
    {
      title: '내용 확인',
      // dataIndex: 'docRef',
      key: 'View',
      render: (_,row) => <Button onClick={() => {
        const docId = row["_id"]
        const docRef = row["docRef"]
        dispatch(setDocToView({ docRef, docId }));
        navigate(`/viewDocument`);
      }}>View</Button>, 
    },
  ];

  useEffect(() => {

    fetch({
      uid: _id,
      pagination,
    });

  }, [_id]);

  return (
    <div>
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
