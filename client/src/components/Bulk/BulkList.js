import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Table, Input, Space, Button, Popconfirm } from "antd";
import Highlighter from 'react-highlight-words';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../app/infoSlice';
import { navigate } from '@reach/router';
import moment from "moment";
import 'moment/locale/ko';
import BulkExpander from "./BulkExpander";
import {
  FileOutlined,
  FileAddOutlined,
  SearchOutlined,
  ProfileOutlined
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-layout';
import 'antd/dist/antd.css';
import { useIntl } from "react-intl";
import { resetAssignAll, setSendType } from '../Assign/AssignSlice';

const BulkList = () => {

  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const { _id } = user;
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [data, setData] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [hasSelected, setHasSelected] = useState(selectedRowKeys.length > 0);
  
  const [pagination, setPagination] = useState({current:1, pageSize:10});
  const [loading, setLoading] = useState(false);
  // const [expandable, setExpandable] = useState();
  const [visiblePopconfirm, setVisiblePopconfirm] = useState(false);

  const { formatMessage } = useIntl();
  const searchInput = useRef<Input>(null)

  const handleTableChange = (pagination, filters, sorter) => {
    console.log("handleTableChange called")
    console.log(filters)
    fetch({
      sortField: sorter.field,
      sortOrder: sorter.order,
      pagination,
      ...filters,
      user: _id
    });
  };

  const fetch = (params = {}) => {
    setLoading(true);

    axios.post('/api/bulk/bulks', params).then(response => {

      console.log(response)
      if (response.data.success) {
        const bulks = response.data.bulks;

        setPagination({...params.pagination, total:response.data.total});
        setData(bulks);
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
    // DB 필터링 사용 시는 주석처리
    // onFilter: (value, record) =>
    //   record[dataIndex]
    //     ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
    //     : '',
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

  const filterSigned = (docs) => {
    return docs.filter((el) =>
      el.signed == true
    );
  }

  const filterCompleted = (docs) => {
    return docs.filter((el) =>
    el.signed == true || el.canceled == true
  );
  }
  
  const columns = [
    {
      title: '문서명',
      dataIndex: 'docTitle',
      sorter: true,
      key: 'docTitle',
      ...getColumnSearchProps('docTitle'),
      expandable: true,
      render: (text,row) => <div style={{ wordWrap: 'break-word', wordBreak: 'break-word' }}><FileOutlined /> {text}</div>, // 여러 필드 동시 표시에 사용
    },
    {
      title: '진행 건수',
      dataIndex: 'total',
      sorter: true,
      key: 'total',
      responsive: ["xs"],
      width: '77px',
      expandable: true,
      render: (text,row) => <div>({filterCompleted(row['docs']).length} / {row['docs'].length})</div>
    },
    {
      title: '진행 건수',
      dataIndex: 'total',
      sorter: true,
      key: 'total',
      responsive: ["sm"],
      width: '135px',
      expandable: true,
      render: (text,row) => <div>({filterCompleted(row['docs']).length} / {row['docs'].length})</div>
    },
    {
      title: '요청자',
      dataIndex: ['user', 'name'],
      sorter: (a, b) => a.user.name.localeCompare(b.user.name),
      key: 'name',
      responsive: ["xs"],
      width: '50px',
      ...getColumnSearchProps('name'),
      onFilter: (value, record) =>
      record['user']['name']
        ? record['user']['name'].toString().toLowerCase().includes(value.toLowerCase())
        : '',
      render: (text, row) => {
        return (
          <React.Fragment>
          {row['user']['name']} {row['user']['JOB_TITLE']}
          </React.Fragment>
        )
      } 
    },
    {
      title: '요청자',
      dataIndex: ['user', 'name'],
      sorter: (a, b) => a.user.name.localeCompare(b.user.name),
      key: 'name',
      responsive: ["sm"],
      width: '100px',
      ...getColumnSearchProps('name'),
      onFilter: (value, record) =>
      record['user']['name']
        ? record['user']['name'].toString().toLowerCase().includes(value.toLowerCase())
        : '',
      render: (text, row) => {
        return (
          <React.Fragment>
          {row['user']['name']} {row['user']['JOB_TITLE']}
          </React.Fragment>
        )
      } 
    },
    {
      title: '요청 일시',
      dataIndex: 'requestedTime',
      sorter: true,
      key: 'requestedTime',
      responsive: ["xs"],
      width: '77px',
      render: (text, row) => {
        return (<font color='#787878'>{moment(row["requestedTime"]).fromNow()}</font>)
      } 
    },
    {
      title: '요청 일시',
      dataIndex: 'requestedTime',
      sorter: true,
      key: 'requestedTime',
      responsive: ["sm"],
      width: '100px',
      render: (text, row) => {
        return (<font color='#787878'>{moment(row["requestedTime"]).fromNow()}</font>)
      } 
    },
    {
      title: '',
      // dataIndex: 'docRef',
      key: 'action',
      responsive: ["sm"],
      width: '50px',
      render: (_,row) => {
        return (
          <Button
            icon={<ProfileOutlined />}
            onClick={() => {        
            // const docId = row["_id"]
            // const docRef = row["docRef"]
            // dispatch(setDocToView({ docRef, docId }));
            navigate(`/bulkDetail`, { state: { bulk: row } } );
          }}>상세</Button>
        )
      }
    },
    {
      title: '',
      // dataIndex: 'docRef',
      key: 'action',
      responsive: ["xs"],
      width: '30px',
      render: (_,row) => {
        return (
          <Button
            icon={<ProfileOutlined />}
            onClick={() => {        
            // const docId = row["_id"]
            // const docRef = row["docRef"]
            // dispatch(setDocToView({ docRef, docId }));
            navigate(`/bulkDetail`, { state: { bulk: row } } );
          }}></Button>
        )
      }
    }
  ];


  const rowSelection = {
    selectedRowKeys,
    onChange : selectedRowKeys => {
      console.log('selectedRowKeys changed: ', selectedRowKeys);
      setSelectedRowKeys(selectedRowKeys)
      setHasSelected(selectedRowKeys.length > 0)
    },
    // selections: [
    //   Table.SELECTION_ALL,
    //   Table.SELECTION_INVERT,
    //   Table.SELECTION_NONE,
    // ],
  };

  useEffect(() => {

    fetch({
      user: _id,
      pagination,
    });

    // const data = [];
    // for (let i = 0; i < 46; i++) {
    //   data.push({
    //     key: i,
    //     templateTitle: `template title ${i}`,
    //     name: `Edward King ${i}`,
    //     requestedTime: `2021-07-02T05:46:40.769+00:00`,
    //   });
    // }
    // setData(data);

  }, [_id]);

  return (
    <div>
    <PageContainer
        ghost
        header={{
          title: formatMessage({id: 'document.bulk'}),
          ghost: false,
          breadcrumb: {
            routes: [
            ],
          },
          extra: [           
          <Button type="primary" icon={<FileAddOutlined />} onClick={() => {
            dispatch(resetAssignAll());
            dispatch(setSendType('B'));
            navigate('/uploadDocument');
            }}>
            대량 서명 요청
          </Button>
          ],
        }}
        content={'한 문서를 여러 명에게 보내 개별 문서에 각각 서명 받을 필요가 있을 경우 (예: 보안서약서, 개별 동의서 등)'}
        footer={[
        ]}
    >
      <br></br>
      <Table
        rowKey={ item => { return item._id } }
        columns={columns}
        dataSource={data}
        pagination={pagination}
        loading={loading}
        // expandedRowRender={row => <BulkExpander item={row} />}
        // expandRowByClick
        // rowSelection={rowSelection}
        onRow={record => ({
          onClick: e => {
            // console.log(`user clicked on row ${record.t1}!`);
          }
        })}
        onChange={handleTableChange}
      />

    </PageContainer>
    </div>
    
  );
};

export default BulkList;
