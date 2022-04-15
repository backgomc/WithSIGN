import React, { useEffect, useState, useRef } from 'react';
import useDidMountEffect from '../Common/useDidMountEffect';
import axios from 'axios';
import { Table, Input, Space, Button, Checkbox, Badge, Tooltip } from "antd";
import Highlighter from 'react-highlight-words';
import {
  SearchOutlined,
  FileOutlined,
  FileAddOutlined,
  FilePdfOutlined,
  DownloadOutlined,
  FormOutlined
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../app/infoSlice';
import { navigate } from '@reach/router';
import { setDocToView } from '../ViewDocument/ViewDocumentSlice';
import { setDocToSign } from '../SignDocument/SignDocumentSlice';
import Moment from 'react-moment';
import moment from "moment";
import "moment/locale/ko";
import {DOCUMENT_SIGNED, DOCUMENT_TOSIGN, DOCUMENT_SIGNING, DOCUMENT_CANCELED, DOCUMENT_TOCONFIRM, DOCUMENT_TODO} from '../../common/Constants';
import { DocumentType, DocumentTypeText, DocumentTypeBadge, DocumentTypeIcon } from './DocumentType';
import DocumentExpander from "./DocumentExpander";
import { PageContainer } from '@ant-design/pro-layout';
import 'antd/dist/antd.css';
import RcResizeObserver from 'rc-resize-observer';
import { useIntl } from "react-intl";
import { setSendType } from '../Assign/AssignSlice';
import banner from '../../assets/images/sub_top2.png';
import ico_sign from '../../assets/images/ico_sign.png';

moment.locale("ko");

const DocumentList = ({location}) => {

  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { formatMessage } = useIntl();

  const { _id } = user;
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [status, setStatus] = useState();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({current:1, pageSize:10});
  const [loading, setLoading] = useState(false);
  const [loadingDownload, setLoadingDownload] = useState([]);
  const [includeBulk, setIncludeBulk] = useState(false);
  const [responsive, setResponsive] = useState(false);

  const searchInput = useRef<Input>(null)



  const handleTableChange = (pagination, filters, sorter) => {
    console.log("handleTableChange called")
    // console.log("status:"+status)
    console.log("filters.status:"+filters.status)
    setStatus(filters.status)

    fetch({
      sortField: sorter.field,
      sortOrder: sorter.order,
      pagination,
      ...filters,
      user: _id,
      includeBulk: includeBulk
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

  const description = (
    <div>
      <table width='100%' style={{tableLayout:'fixed'}}>
        <tr>
          <td align='left' width='350px'>
            <b><Badge status="processing" text={DOCUMENT_TODO} /></b> : 본인의 서명 또는 수신이 필요한 문서<br></br>
            <b><Badge color="#9694ff" text={DOCUMENT_SIGNING} /></b> : 다른 서명 참여자의 서명이 진행 중인 문서<br></br>
            <b><Badge status="error" text={DOCUMENT_CANCELED} /></b> : 서명 참여자 중 서명을 취소한 문서 <br></br>
            <b><Badge status="success" text={DOCUMENT_SIGNED} /></b> : 모든 서명 참여자의 서명이 완료된 문서 
          </td>
          <td align='right'>
          < img src={banner} width="500px" />
          </td>
        </tr>
      </table>
      {/* <div style={{textAlign:'left'}}>
        <b><Badge status="processing" text="서명 필요" /></b> : 본인의 서명이 필요한 문서<br></br>
        <b><Badge status="default" text="서명 진행" /></b> : 다른 서명 참여자의 서명이 진행 중인 문서<br></br>
        <b><Badge status="error" text="서명 취소" /></b> : 서명 참여자 중 서명을 취소한 문서 <br></br>
        <b><Badge status="success" text="서명 완료" /></b> : 모든 서명 참여자의 서명이 완료된 문서 
      </div> */}
    </div>
  )

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
    // {
    //   title: '상태',
    //   dataIndex: 'status',
    //   responsive: ["xs"],
    //   sorter: false,
    //   key: 'status',
    //   defaultFilteredValue: location.state.status? [location.state.status]: [],
    //   filters: [
    //     {
    //       text: DOCUMENT_SIGNED,
    //       value: DOCUMENT_SIGNED,
    //     },
    //     {
    //       text: DOCUMENT_TOSIGN,
    //       value: DOCUMENT_TOSIGN,
    //     },
    //     {
    //       text: DOCUMENT_SIGNING,
    //       value: DOCUMENT_SIGNING,
    //     },
    //     {
    //       text: DOCUMENT_CANCELED,
    //       value: DOCUMENT_CANCELED,
    //     },
    //   ],
    //   onFilter: (value, record) => DocumentType({uid: _id, document: record}).indexOf(value) === 0,
    //   render: (_,row) => {
    //     return (
    //         <DocumentTypeIcon uid={_id} document={row} />
    //       )
    //   }, 
    // },
    {
      title: '상태',
      dataIndex: 'status',
      // responsive: ["sm"],
      sorter: false,
      key: 'status',
      width: '110px',
      defaultFilteredValue: location.state.status? [location.state.status]: [],
      filterMultiple: false,
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
            <DocumentTypeBadge uid={_id} document={row} />
          )
      },
    },
    {
      title: '요청자',
      responsive: ["sm"],
      dataIndex: ['user', 'name'],
      // sorter: (a, b) => a.user.name.localeCompare(b.user.name),  // Populate Collection 단위로 정렬되고, 전체 Collection에 적용 안되어 대안 필요
      sorter: false,
      key: 'name',
      width: '110px',
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
      // sorter: (a, b) => a.user.name.localeCompare(b.user.name),  // Populate Collection 단위로 정렬되고, 전체 Collection에 적용 안되어 대안 필요
      sorter: false,
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
            <font color='#787878'>{moment(row["recentTime"]).fromNow()}</font>
            </React.Fragment>
          )
      } 
    },
    {
      title: '참여자',
      responsive: ["sm"],
      dataIndex: ['users'],
      key: 'users',
      width: '120px',
      render: (users, row) => {
        return (
          <React.Fragment>
            {users.length > 1 ? <Tooltip placement="top" title={row.users.map((user, index) => ( user.name+' '+user.JOB_TITLE+ (index==users.length-1 ? '' : ', ')  ))}>{users[0].name +' '+ '외 '+ (users.length -1) + '명'}</Tooltip> : users[0].name +' '+ (users[0].JOB_TITLE?users[0].JOB_TITLE:'')}
          {/* {
              row.users.map((user, index) => (
                user.name
            ))
          }             */}
          {/* {row['user']['name']} {row['user']['JOB_TITLE']} */}
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
      title: '최근 활동',
      dataIndex: 'recentTime',
      responsive: ["sm"],
      sorter: true,
      key: 'recentTime',
      width: '100px',
      render: (text, row) => {
          // return <Moment format='YYYY/MM/DD HH:mm'>{row["requestedTime"]}</Moment>
          return (<font color='#787878'>{moment(row["recentTime"]).fromNow()}</font>)
      } 
    },
    {
      title: '',
      // dataIndex: 'docRef',
      key: 'action',
      width: '50px',
      responsive: ["xs"],
      render: (_,row) => {
        switch (DocumentType({uid: _id, document: row})) {
          case DOCUMENT_CANCELED:
            return (
              <Tooltip placement="top" title={'문서 보기'}>
              <Button
                // danger
                icon={<FileOutlined />}
                onClick={() => {        
                const docId = row["_id"]
                const docRef = row["docRef"]
                const docType = row["docType"]
                const docTitle = row["docTitle"]
                dispatch(setDocToView({ docRef, docId, docType, docTitle }));
                navigate(`/viewDocument`);
              }}></Button></Tooltip>
            )
          case DOCUMENT_SIGNED:
            return (
              <div>
              <Tooltip placement="top" title={'문서 보기'}>
              <Button
                // loading={isUploading(row)}
                key="1"
                icon={<FileOutlined />}
                onClick={() => {        
                const docId = row["_id"]
                const docRef = row["docRef"]
                const docType = row["docType"]
                const docTitle = row["docTitle"]
                const status = DOCUMENT_SIGNED
                dispatch(setDocToView({ docRef, docId, docType, docTitle, status }));
                navigate(`/viewDocument`);
              }}></Button></Tooltip>
              {/* <a href={row["docRef"]} download={row["docTitle"]+'.pdf'}> 
                <Button key="2" icon={<DownloadOutlined />}>
                </Button>
             </a> */}
              </div>
            )
          case DOCUMENT_TOSIGN:
            return (
              // <Button type="primary" icon={<img src={ico_sign} style={{marginLeft:'-7px', marginRight:'7px'}}></img>} onClick={() => {
              <Tooltip placement="top" title={(row["observers"] && row["observers"].includes(_id) ? '수신' : '서명')}>
              <Button type="primary" disabled={(row["orderType"] == 'S' && !row["usersTodo"].includes(_id))} icon={<FormOutlined />} onClick={() => {
                const docId = row["_id"]
                const docRef = row["docRef"]
                const docType = row["docType"]
                const docUser = row["user"]
                const observers = row["observers"]
                const orderType = row["orderType"];
                const usersTodo = row["usersTodo"];
                const usersOrder = row["usersOrder"];
                dispatch(setDocToSign({ docRef, docId, docType, docUser, observers, orderType, usersTodo, usersOrder }));
                navigate(`/signDocument`);
              }}>
                {/* {(row["observers"] && row["observers"].includes(_id) ? '수신' : '서명')} */}
              </Button></Tooltip>
            );
          case DOCUMENT_SIGNING:
            return (
              <Tooltip placement="top" title={'문서 보기'}>
              <Button 
              icon={<FileOutlined />}  
              onClick={() => {        
                const docId = row["_id"]
                const docRef = row["docRef"]
                const docType = row["docType"]
                const docTitle = row["docTitle"]
                dispatch(setDocToView({ docRef, docId, docType, docTitle }));
                navigate(`/viewDocument`);
              }}></Button></Tooltip>
            );
          default:
            return (
              <div></div>
            )
        }
      }, 
    },
    {
      title: '',
      // dataIndex: 'docRef',
      key: 'action',
      width: '110px',
      responsive: ["sm"],
      render: (_,row) => {
        switch (DocumentType({uid: _id, document: row})) {
          case DOCUMENT_CANCELED:
            return (
              <Tooltip placement="top" title={'문서 보기'}>
              <Button
                // danger
                icon={<FileOutlined />}
                onClick={() => {        
                const docId = row["_id"]
                const docRef = row["docRef"]
                const docType = row["docType"]
                const docTitle = row["docTitle"]
                dispatch(setDocToView({ docRef, docId, docType, docTitle }));
                navigate(`/viewDocument`);
              }}></Button>
              </Tooltip>
            )
          case DOCUMENT_SIGNED:
            return (
              <div>
              <Tooltip placement="top" title={'문서 보기'}>
              <Button
                // loading={isUploading(row)}
                key="1"
                icon={<FileOutlined />}
                onClick={() => {        
                const docId = row["_id"]
                const docRef = row["docRef"]
                const docType = row["docType"]
                const docTitle = row["docTitle"]
                const status = DOCUMENT_SIGNED
                dispatch(setDocToView({ docRef, docId, docType, docTitle, status }));
                navigate(`/viewDocument`);
              }}></Button></Tooltip>&nbsp;&nbsp;
              {/* <a href={row["docRef"]} download={row["docTitle"]+'.pdf'}> */}
                <Tooltip placement="top" title={'다운로드'}>
                <Button key="2" href={'/api/storage/documents/'+row["_id"]} download={row["docTitle"]+'.pdf'} icon={<DownloadOutlined />} loading={loadingDownload[row["_id"]]}  onClick={(e) => {
                // <Button key="2" href={row["docRef"]} download={row["docTitle"]+'.pdf'} icon={<DownloadOutlined />} loading={loadingDownload[row["_id"]]}  onClick={(e) => {
                  setLoadingDownload( { [row["_id"]] : true } )
                  setTimeout(() => {
                    setLoadingDownload( { [row["_id"]] : false})
                  }, 3000);
                }}>
                </Button>
                </Tooltip>
             {/* </a> */}
              </div>
            )
          case DOCUMENT_TOSIGN:
            return (
              // <Button type="primary" icon={<img src={ico_sign} style={{marginLeft:'-7px', marginRight:'7px'}}></img>} onClick={() => {
              <Button type="primary" disabled={(row["orderType"] == 'S' && !row["usersTodo"].includes(_id))} style={{paddingLeft:'9px', paddingRight:'10px'}} icon={<FormOutlined />} onClick={() => {
                const docId = row["_id"]
                const docRef = row["docRef"]
                const docType = row["docType"]
                const docUser = row["user"]
                const observers = row["observers"]
                const orderType = row["orderType"];
                const usersTodo = row["usersTodo"];
                const usersOrder = row["usersOrder"];
                dispatch(setDocToSign({ docRef, docId, docType, docUser, observers, orderType, usersTodo, usersOrder }));
                navigate(`/signDocument`);
              }}>

                {row["orderType"] == 'S' && !row["usersTodo"].includes(_id) ? '대기' : (row["observers"] && row["observers"].includes(_id) ? '수신' : '서명')}
                {/* {(row["observers"] && row["observers"].includes(_id) ? '수신' : '서명')} */}

              </Button>
            );
          case DOCUMENT_SIGNING:
            return (
              <Tooltip placement="top" title={'문서 보기'}>
              <Button 
              icon={<FileOutlined />}  
              onClick={() => {        
                const docId = row["_id"]
                const docRef = row["docRef"]
                const docType = row["docType"]
                const docTitle = row["docTitle"]
                dispatch(setDocToView({ docRef, docId, docType, docTitle }));
                navigate(`/viewDocument`);
              }}></Button></Tooltip>
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
    console.log("includeBulk:"+location.state.includeBulk)

    if (location.state.status) {
      setStatus(location.state.status)
    }

    // HOME 에서 대량 발송 건 포함 이동해온 경우 대량 발송 건 포함 useDidMountEffect 서비스로 목록 호출
    if (location.state.includeBulk) {
      setIncludeBulk(location.state.includeBulk)
      return;
    }

    fetch({
      user: _id,
      pagination,
      status:location.state.status
    });

    console.log("location.state.docId:"+ location.state.docId)

  }, []);

  // 화면이 처음 로딩시에는 호출되지 않도록 함
  useDidMountEffect(() => {

    console.log("useEffect called includeBulk : " + includeBulk)
    console.log("useEffect called status : " + status)
    // if (location.state.status) {
    //   setStatus(location.state.status)
    // }

    fetch({
      user: _id,
      pagination,
      status:location.state.status,
      includeBulk: includeBulk,
      status: status
    });

    // console.log("location.state.docId:"+ location.state.docId)

  }, [includeBulk]);

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
          extra: [       
            // <Switch
            //   checkedChildren="대량전송 포함"
            //   unCheckedChildren="대량전송 포함"
            //   checked={includeBulk}
            //   onChange={() => {
            //     setIncludeBulk(!includeBulk);
            //   }}
            // />,    
            <Checkbox checked={includeBulk} onChange={(e) => {setIncludeBulk(e.target.checked)}}>대량 전송 포함</Checkbox>,
            <Button icon={<FileAddOutlined />} type="primary" onClick={() => {
              dispatch(setSendType('G'));
              navigate('/uploadDocument');
              }}>
              서명 요청
            </Button>,
            ],
        }}
        content={description}
        // extraContent={
        //   <img
        //     src={banner}
        //     width="100%"
        //   />
        // }
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
        // expandable={expandableData}
        defaultExpandedRowKeys={[location.state.docId]}
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
