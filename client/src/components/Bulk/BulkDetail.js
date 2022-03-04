import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Table, Input, Space, Button, Descriptions, Tooltip, Modal, message } from "antd";
import Highlighter from 'react-highlight-words';
import { SearchOutlined, BellFilled, FileExcelOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../app/infoSlice';
import { navigate } from '@reach/router';
import { setDocToView } from '../ViewDocument/ViewDocumentSlice';
import Moment from 'react-moment';
import moment from "moment";
import 'moment/locale/ko';
import BulkExpander from "./BulkExpander";
import { DocumentType, DocumentTypeBadge, DocumentTypeIcon } from '../Lists/DocumentType';
import {DOCUMENT_SIGNED, DOCUMENT_TOSIGN, DOCUMENT_SIGNING, DOCUMENT_CANCELED, DOCUMENT_TOCONFIRM} from '../../common/Constants';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import {
  FileOutlined,
  FilePdfOutlined,
  DownloadOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-layout';
import 'antd/dist/antd.css';
import { useIntl } from "react-intl";

const { confirm } = Modal;

const BulkDetail = ({location}) => {

  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const bulk = location.state.bulk
  const { _id } = user;
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [data, setData] = useState([]);
  const [orgInfos, setOrgInfos] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [hasSelected, setHasSelected] = useState(selectedRowKeys.length > 0);
  
  const [pagination, setPagination] = useState({current:1, pageSize:10});
  const [loading, setLoading] = useState(false);
  const [loadingDownload, setLoadingDownload] = useState([]);
  const [loadingOrgInfos, setLoadingOrgInfos] = useState(false);
  // const [expandable, setExpandable] = useState();
  const [visiblePopconfirm, setVisiblePopconfirm] = useState(false);

  const { formatMessage } = useIntl();
  const searchInput = useRef<Input>(null)

  const handleTableChange = (pagination, filters, sorter) => {
    console.log("handleTableChange called")
    console.log(filters)
    // fetch({
    //   sortField: sorter.field,
    //   sortOrder: sorter.order,
    //   pagination,
    //   ...filters,
    //   user: _id
    // });
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

  const fetchOrgInfos = async () => {
    console.log('fetchOrgInfos called')
    setLoadingOrgInfos(true);
    var DEPART_CODES = [];

    bulk.users.map((user, index) => (
        DEPART_CODES.push(user.DEPART_CODE)
    ))
    DEPART_CODES.push(bulk.user.DEPART_CODE)

    const res = await axios.post('/api/users/orgInfos', {DEPART_CODES: DEPART_CODES})
    
    if (res.data.success) {
        setOrgInfos(res.data.results)
    }
    
    setLoadingOrgInfos(false);
  }

  const fetchNotify = async () => {
    setLoading(true);
    let param = {
      usrId: _id,
      bulkId: bulk._id
    }
    axios.post('/api/document/notify/B', param).then(response => {
      message.success({content: '미서명자에게 아이프로넷 쪽지&With 메시지로 재요청 알림 전송하였습니다.', style: {marginTop: '70vh'}});
      setLoading(false);
    });
  }

  const sendPush = async () => {
    confirm({
      title: '서명 재요청',
      icon: <BellFilled />,
      content: '미서명자에게 서명 재요청을 하시겠습니까?',
      okType: 'confirm',
      okText: '네',
      cancelText: '아니오',
      onOk() {
        fetchNotify();
      },
      onCancel() {
        console.log('Cancel');
      }
    });
  }

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

  const filterUsers = (query) => {
    return bulk.users.filter((el) =>
      el._id.toString().toLowerCase().indexOf(query.toString().toLowerCase()) > -1
    );
  }

  const filterSigned = (query) => {
    return bulk.docs.filter((el) =>
      el.signed == query
    );
  }

  const filterCanceled = (query) => {
    return bulk.docs.filter((el) =>
      el.canceled == query
    );
  }

  const filterProcessing = () => {
    return bulk.docs.filter((el) =>
      el.signed == false && el.canceled != true
    );
  }

  // EXCEL 다운로드
  const handleExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(formatMessage({id: 'document.bulk'}));

    // sheet 데이터 설정
    worksheet.columns = [
      { header: '문서명', key: 'docName', width: 32 },
      { header: '서명 요청자', key: 'rqstUser', width: 16 },
      { header: '요청일시', key: 'rqstTime', width: 24 },
      { header: '상태', key: 'status', width: 8 },
      { header: '서명 참여자', key: 'signUserName', width: 8 },
      { header: '', key: 'signUserJobTitle', width: 8 },
      { header: '', key: 'signUserOrgInfo', width: 16 },
      { header: '서명일시', key: 'signTime', width: 32 }
    ];
    
    for (var idx = 0; idx < bulk['docs'].length; idx++) {
      worksheet.addRow({docName: bulk['docTitle'],
                        rqstUser: bulk['user']['name'] + (bulk['user']['JOB_TITLE']?' '+bulk['user']['JOB_TITLE']:''),
                        rqstTime: moment(bulk['requestedTime']).format('YYYY-MM-DD HH:mm:ss'),
                        status: DocumentType({uid: _id, document: bulk['docs'][idx]}),
                        signUserName: filterUsers(bulk['docs'][idx]['users'][0])[0]['name'],
                        signUserJobTitle: filterUsers(bulk['docs'][idx]['users'][0])[0]['JOB_TITLE'] ? ' ' + filterUsers(bulk['docs'][idx]['users'][0])[0]['JOB_TITLE'] : '',
                        signUserOrgInfo: orgInfos.filter(e => e.DEPART_CODE == filterUsers(bulk['docs'][idx]['users'][0])[0]['DEPART_CODE']).length > 0 ? orgInfos.filter(e => e.DEPART_CODE == filterUsers(bulk['docs'][idx]['users'][0])[0]['DEPART_CODE'])[0]['DEPART_NAME'] : '',
                        signTime: bulk['docs'][idx]['signedTime']?moment(bulk['docs'][idx]['signedTime']).format('YYYY-MM-DD HH:mm:ss'):'서명 전'
                      });
    }
    
    worksheet.mergeCells('E1:G1');

    const mimeType = { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], mimeType);
    saveAs(blob, formatMessage({id: 'document.bulk'}) + '' + '.xlsx');
  };
  
  const columns = [
    {
      title: '문서명',
      dataIndex: 'docTitle',
      sorter: true,
      key: 'docTitle',
      ...getColumnSearchProps('docTitle'),
      expandable: true,
      render: (text,row) => <div style={{ wordWrap: 'break-word', wordBreak: 'break-word' }}><FileOutlined /> {text}</div>, // 여러 필드 동시 표시에 사용
      sorter: (a, b) => a.docTitle.length - b.docTitle.length,
      // sortDirections: ['descend'],
    },
    // {
    //   title: '상태',
    //   dataIndex: 'state',
    //   sorter: true,
    //   key: 'state',
    //   expandable: true,
    //   render: (text, row) => {
    //     return (row["signed"] ? "서명 완료" : "서명 대기")
    //   } 
    // },
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
      width: '105px',
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
            <DocumentTypeBadge uid={_id} document={row} />
          )
      }, 
    },
    {
      title: '서명 참여자',
      dataIndex: 'user',
      responsive: ["sm"],
      ...getColumnSearchProps('user'),
      // sorter: true,
      key: 'user',
      width: '220px',
      expandable: true,
      onFilter: (value, row) =>
        filterUsers(row['users'][0])[0].name
          ? filterUsers(row['users'][0])[0].name.toString().toLowerCase().includes(value.toLowerCase())
          : '',
      render: (text, row) => <div>
        {filterUsers(row['users'][0]).length > 0 ? filterUsers(row['users'][0])[0].name +' '+ (filterUsers(row['users'][0])[0].JOB_TITLE ? filterUsers(row['users'][0])[0].JOB_TITLE : '') : ''}
        {orgInfos.filter(e => e.DEPART_CODE == filterUsers(row['users'][0])[0].DEPART_CODE).length > 0 ? <font color='grey'>{' ['+orgInfos.filter(e => e.DEPART_CODE == filterUsers(row['users'][0])[0].DEPART_CODE)[0].DEPART_NAME+']'}</font> : ''}
        </div>
    },
    {
      title: '참여자',
      dataIndex: 'user',
      responsive: ["xs"],
      sorter: true,
      key: 'user',
      width: '75px',
      expandable: true,
      render: (text,row) => <div>{filterUsers(row['users'][0]).length > 0 ? filterUsers(row['users'][0])[0].name : ''}</div>
    },
    {
      title: '요청 일시',
      dataIndex: 'requestedTime',
      responsive: ["sm"],
      // sorter: true,
      key: 'requestedTime',
      width: '100px',
      render: (text, row) => {
        return (<font color='#787878'>{moment(row["requestedTime"]).fromNow()}</font>)
      } 
    },
    {
      title: '서명 일시',
      dataIndex: 'signedTime',
      responsive: ["sm"],
      // sorter: true,
      key: 'signedTime',
      width: '100px',
      render: (text, row) => {
        return (row["signedTime"] ? <font color='#787878'>{moment(row["signedTime"]).fromNow()}</font> : <font color='#787878'>서명 전</font>)
      }
    },
    {
      title: '서명 일시',
      dataIndex: 'signedTime',
      responsive: ["xs"],
      // sorter: true,
      key: 'signedTime',
      width: '60px',
      render: (text, row) => {
        return (row["signedTime"] ? <font color='#787878'>{moment(row["signedTime"]).fromNow()}</font> : <font color='#787878'>서명 전</font>)
      }
    },
    {
      title: '',
      key: 'action',
      responsive: ["sm"],
      width: '110px',
      render: (_,row) => {
        return (
          row["signedTime"] ?
          <div>
          <Tooltip placement="top" title={'문서 보기'}>
          <Button
            icon={<FileOutlined />}
            onClick={() => {        
            const docId = row["_id"]
            const docRef = row["docRef"]
            const docTitle = row["docTitle"]
            dispatch(setDocToView({ docRef, docId, docTitle }));
            navigate(`/viewDocument`);
          }}></Button></Tooltip>&nbsp;&nbsp;
              <Tooltip placement="top" title={'다운로드'}>
                <Button key="3" href={row["docRef"]} download={row["docTitle"]+'_'+filterUsers(row['users'][0])[0].name+'.pdf'} icon={<DownloadOutlined />} loading={loadingDownload[row["_id"]]}  onClick={(e) => {
                  setLoadingDownload( { [row["_id"]] : true } )
                  setTimeout(() => {
                    setLoadingDownload( { [row["_id"]] : false})
                  }, 3000);
                }}>
                </Button>
              </Tooltip>
          </div>  : ''
        )
      }
    },
    {
      title: '',
      key: 'action',
      responsive: ["xs"],
      width: '50px',
      render: (_,row) => {
        return (
          row["signedTime"] ?
          <Tooltip placement="top" title={'문서 보기'}>
          <Button
            icon={<FileOutlined />}
            onClick={() => {        
            const docId = row["_id"]
            const docRef = row["docRef"]
            const docTitle = row["docTitle"]
            dispatch(setDocToView({ docRef, docId, docTitle }));
            navigate(`/viewDocument`);
          }}></Button></Tooltip> : ''
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

    // fetch({
    //   user: _id,
    //   pagination,
    // });

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

    console.log("useEffect called")
    console.log("bulk:"+bulk)

    fetchOrgInfos();

    //TODO 테이블 데이터 셋팅
    setData(bulk.docs) 

  }, []);

  return (
    <div>
    <PageContainer
        ghost
        header={{
          title: bulk.docTitle,
          ghost: false,
          // breadcrumb: {
          //   routes: [
          //     {
          //       path: '',
          //       breadcrumbName: '대량 전송',
          //     },
          //     {
          //       path: '',
          //       breadcrumbName: '자세히 보기',
          //     },
          //   ],
          // },
          extra: [
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={() => {navigate('/bulkList');}}>
                {/* {formatMessage({id: 'Back'})} */}
              </Button>
              {(filterProcessing().length > 0)?<Button icon={<BellFilled />} onClick={sendPush}>
                재요청
              </Button>:''}
              <Button icon={<FileExcelOutlined />} onClick={handleExcel}>
                {formatMessage({id: 'excel.download'})}
              </Button>
            </Space>
          ],
        }}
        content={
          <Descriptions column={2} style={{ marginBottom: -16 }}>
            <Descriptions.Item label="전체 건수">{bulk.docs.length} 건</Descriptions.Item>
            <Descriptions.Item label="완료 건수">
              {filterSigned(true).length} 건
            </Descriptions.Item>
            <Descriptions.Item label="대기 건수">
              {filterProcessing().length} 건
            </Descriptions.Item>
            <Descriptions.Item label="취소 건수">
              {filterCanceled(true).length} 건
            </Descriptions.Item>
            <Descriptions.Item label="요청 일시"><Moment format='YYYY/MM/DD HH:mm'>{bulk.requestedTime}</Moment></Descriptions.Item>
            <Descriptions.Item label="서명 요청자">{bulk.user.name} {bulk.user.JOB_TITLE}</Descriptions.Item>
          </Descriptions>
        }
        footer={[
        ]}
    >
      <br></br>
      <Table
        rowKey={ item => { return item._id } }
        columns={columns}
        dataSource={data}
        // pagination={pagination}
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

export default BulkDetail;
