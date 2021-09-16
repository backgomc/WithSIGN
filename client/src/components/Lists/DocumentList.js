import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Table, Input, Space, Button, Popover } from "antd";
import Highlighter from 'react-highlight-words';
import { SearchOutlined, FileOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../app/infoSlice';
import { navigate } from '@reach/router';
import { setDocToView } from '../ViewDocument/ViewDocumentSlice';
import { setDocToSign } from '../SignDocument/SignDocumentSlice';
import Moment from 'react-moment';
import moment from "moment";
import "moment/locale/ko";
import { DocumentType, DocumentTypeText, DocumentTypeIcon, DOCUMENT_SIGNED, DOCUMENT_TOSIGN, DOCUMENT_SIGNING, DOCUMENT_CANCELED } from './DocumentType';
import DocumentExpander from "./DocumentExpander";
import { PageContainer } from '@ant-design/pro-layout';
import 'antd/dist/antd.css';
import RcResizeObserver from 'rc-resize-observer';
import { useIntl } from "react-intl";

moment.locale("ko");

const DocumentList = ({location}) => {

  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const { _id } = user;
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  // const [status, setStatus] = useState(null);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({current:1, pageSize:10});
  const [loading, setLoading] = useState(false);
  const [responsive, setResponsive] = useState(false);
  
  const { formatMessage } = useIntl();
  const searchInput = useRef<Input>(null)

  const handleTableChange = (pagination, filters, sorter) => {
    console.log("handleTableChange called")
    // console.log("status:"+status)
    console.log("filters:"+filters)
    fetch({
      sortField: sorter.field,
      sortOrder: sorter.order,
      pagination,
      ...filters,
      user: _id,
      // status:status  //필터에 포함되어 있음 
    });
  };

  const fetch = (params = {}) => {
    setLoading(true);

    axios.post('/api/document/documents', params).then(response => {

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
            검색
          </Button>
          <Button onClick={() => handleReset(clearFilters)} size="small" style={{ width: 90 }}>
            초기화
          </Button>
          {/* <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({ closeDropdown: false });
              setSearchText(selectedKeys[0])
              setSearchedColumn(dataIndex)
            }}
          >
            필터
          </Button> */}
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


  // const Expander = props => <span>{props.record.docTitle}</span>;

  // const expandableData = {
  //     expandedRowRender: record => <p style={{ margin: 0 }}>{record.docTitle}</p>
  // }

  // const isUploading = (row) => {
  //   // 내가 문서 사인하고 10초 정도는 upload 시간 벌어주기
  //   var val = false

  //   if (row["signedBy"].some(e => e.user === _id)) {
  //     var t1 = moment()
  //     var t2 = moment(row["signedBy"].filter(e => e.user === _id)[0]["signedTime"])
  //     // console.log("t1:"+t1)
  //     // console.log("t2:"+t2)
  //     // console.log("차이:"+t1.diff(t2, "seconds", true))
  //     if (t1.diff(t2, "seconds", true) < 10) {  //10초보다 작으면 문서업로딩중으로 판단 
  //       val = true
  //     }
  //     return val 
  //   }
  // }
  
  const columns = [
    {
      title: '문서명',
      dataIndex: 'docTitle',
      sorter: true,
      key: 'docTitle',
      ...getColumnSearchProps('docTitle'),
      expandable: true,
      render: (text,row) =>  <div style={{ wordWrap: 'break-word', wordBreak: 'break-word' }}><FileOutlined /> {text}</div>, // 여러 필드 동시 표시에 사용
    },
    {
      title: '상태',
      dataIndex: 'status',
      responsive: ["xs"],
      sorter: false,
      key: 'status',
      defaultFilteredValue: location.state.status? [location.state.status]: [],
      filters: [
        {
          text: DOCUMENT_SIGNED,
          value: DOCUMENT_SIGNED,
        },
        {
          text: DOCUMENT_TOSIGN,
          value: DOCUMENT_TOSIGN,
        },
        {
          text: DOCUMENT_SIGNING,
          value: DOCUMENT_SIGNING,
        },
        {
          text: DOCUMENT_CANCELED,
          value: DOCUMENT_CANCELED,
        },
      ],
      onFilter: (value, record) => DocumentType({uid: _id, document: record}).indexOf(value) === 0,
      render: (_,row) => {
        return (
            <DocumentTypeIcon uid={_id} document={row} />
          )
      }, 
    },
    {
      title: '상태',
      dataIndex: 'status',
      responsive: ["sm"],
      sorter: false,
      key: 'status',
      defaultFilteredValue: location.state.status? [location.state.status]: [],
      filters: [
        {
          text: DOCUMENT_SIGNED,
          value: DOCUMENT_SIGNED,
        },
        {
          text: DOCUMENT_TOSIGN,
          value: DOCUMENT_TOSIGN,
        },
        {
          text: DOCUMENT_SIGNING,
          value: DOCUMENT_SIGNING,
        },
        {
          text: DOCUMENT_CANCELED,
          value: DOCUMENT_CANCELED,
        },
      ],
      onFilter: (value, record) => DocumentType({uid: _id, document: record}).indexOf(value) === 0,
      render: (_,row) => {
        return (
            <DocumentTypeText uid={_id} document={row} />
          )
      }, 
    },
    {
      title: '요청자',
      responsive: ["sm"],
      dataIndex: ['user', 'name'],
      sorter: (a, b) => a.user.name.localeCompare(b.user.name),
      key: 'name',
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
      responsive: ["xs"],
      dataIndex: ['user', 'name'],
      sorter: (a, b) => a.user.name.localeCompare(b.user.name),
      key: 'name',
      ...getColumnSearchProps('name'),
      onFilter: (value, record) =>
      record['user']['name']
        ? record['user']['name'].toString().toLowerCase().includes(value.toLowerCase())
        : '',
      render: (text, row) => {
          return (
            <React.Fragment>
            {row['user']['name']}
            <br />
            <font color='#787878'>{moment(row["requestedTime"]).fromNow()}</font>
            </React.Fragment>
          )
      } 
    },
    // {
    //   title: 'adasd',
    //   dataIndex: '_id',
    //   sorter: true,
    //   key: '_id',
    //   ...getColumnSearchProps('_id'),
    //   onFilter: (value, record) =>
    //   record['_id']
    //     ? record['_id'].toString().toLowerCase().includes(value.toLowerCase())
    //     : ''
    // },
    {
      title: '요청 일시',
      dataIndex: 'requestedTime',
      responsive: ["sm"],
      sorter: true,
      key: 'requestedTime',
      render: (text, row) => {
          // return <Moment format='YYYY/MM/DD HH:mm'>{row["requestedTime"]}</Moment>
          return (<font color='#787878'>{moment(row["requestedTime"]).fromNow()}</font>)
      } 
    },
    {
      title: '활동',
      // dataIndex: 'docRef',
      key: 'action',
      render: (_,row) => {
        switch (DocumentType({uid: _id, document: row})) {
          case DOCUMENT_CANCELED:
            return (
              <Button
                // danger
                onClick={() => {        
                const docId = row["_id"]
                const docRef = row["docRef"]
                const docType = row["docType"]
                dispatch(setDocToView({ docRef, docId, docType }));
                navigate(`/viewDocument`);
              }}>문서조회</Button>
            )
          case DOCUMENT_SIGNED:
            return (
              <Button
                // loading={isUploading(row)}
                onClick={() => {        
                const docId = row["_id"]
                const docRef = row["docRef"]
                const docType = row["docType"]
                dispatch(setDocToView({ docRef, docId, docType }));
                navigate(`/viewDocument`);
              }}>문서조회</Button>
            )
          case DOCUMENT_TOSIGN:
            return (
              <Button type="primary" onClick={() => {
                const docId = row["_id"]
                const docRef = row["docRef"]
                const docType = row["docType"]
                dispatch(setDocToSign({ docRef, docId, docType }));
                navigate(`/signDocument`);
              }}>서명하기</Button>
            );
          case DOCUMENT_SIGNING:
            return (
              <Button onClick={() => {        
                const docId = row["_id"]
                const docRef = row["docRef"]
                const docType = row["docType"]
                dispatch(setDocToView({ docRef, docId, docType }));
                navigate(`/viewDocument`);
              }}>문서조회</Button>
            );
          default:
            return (
              <div></div>
            )
        }

      }, 
    },
  ];

  useEffect(() => {

    console.log("useEffect called")

    // if (location.state.status) {
    //   setStatus(location.state.status)
    // }

    fetch({
      user: _id,
      pagination,
      status:location.state.status
    });

  }, [_id]);

  return (
    <div>
    <PageContainer
        ghost
        header={{
          title: formatMessage({id: 'document.list'}),
          ghost: false,
          breadcrumb: {
            routes: [
              // {
              //   path: '/',
              //   breadcrumbName: 'Home',
              // },
              // {
              //   path: '../',
              //   breadcrumbName: '내 문서',
              // },
            ],
          },
          extra: [  // 여기 이미지 삽입하면 될듯
          ],
        }}
        // content={'서명에 사용되는 사인을 미리 등록할 수 있습니다.'}
        footer={[
        ]}
    >
      <br></br>
      <Table
        rowKey={ item => { return item._id } }
        columns={columns}
        // rowKey={record => record.login.uuid}
        dataSource={data}
        pagination={pagination}
        loading={loading}
        // expandable={expandableData}
        expandedRowRender={row => <DocumentExpander item={row} />}
        expandRowByClick
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

export default DocumentList;
