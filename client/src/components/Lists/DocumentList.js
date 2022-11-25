import React, { useEffect, useState, useRef } from 'react';
import useDidMountEffect from '../Common/useDidMountEffect';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { Table, Input, Space, Button, Checkbox, Badge, Tooltip, Select, Typography, Modal, message, TreeSelect, Switch, Radio, Empty } from "antd";
import Highlighter from 'react-highlight-words';
import {
  SearchOutlined,
  FileOutlined,
  FileAddOutlined,
  FilePdfOutlined,
  DownloadOutlined,
  CheckCircleTwoTone,
  FolderOpenFilled,
  FolderOpenOutlined,
  FolderOpenTwoTone,
  FolderAddTwoTone,
  DeleteTwoTone,
  SettingOutlined,
  PaperClipOutlined,
  TeamOutlined,
  FormOutlined
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../app/infoSlice';
import { navigate, Link } from '@reach/router';
import { setDocToView } from '../ViewDocument/ViewDocumentSlice';
import { setDocToSign } from '../SignDocument/SignDocumentSlice';
import { setPathname } from '../../config/MenuSlice';
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
import { resetDocumentTempPath, setSendType, setDocumentType, resetAssignAll } from '../Assign/AssignSlice';
import banner from '../../assets/images/sub_top2.png';
import banner_small from '../../assets/images/sub_top2_2.png';
import styled from 'styled-components';
import loadash from 'lodash';

const { Search } = Input;
const CardTitle = styled.div`
  text-overflow: ellipsis;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
`;

moment.locale("ko");
const { Option } = Select;
const { SHOW_PARENT } = TreeSelect;

const DocumentList = ({location}) => {

  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { formatMessage } = useIntl();

  const { _id } = user;
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [status, setStatus] = useState();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(location.state.pagination ? location.state.pagination : {current:1, pageSize:10, showSizeChanger:true, pageSizeOptions: ["10", "20", "30"]});
  const [loading, setLoading] = useState(false);
  const [loadingDownload, setLoadingDownload] = useState([]);
  const [loadingFolder, setLoadingFolder] = useState(false);
  const [manageInput, setManageInput] = useState('');
  const [manageModal, setManageModal] = useState(false);
  const [moveModal, setMoveModal] = useState(false);
  const [shareModal, setShareModal] = useState(false);
  const [disableLink, setDisableLink] = useState(true);
  const [users, setUsers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [myOrgs, setMyOrgs] = useState();
  const [treeValue, setTreeValue] = useState();
  const [treeData, setTreeData] = useState();
  const [editable, setEditable] = useState(false);
  const [expandable, setExpandable] = useState(true);
  const [moveFolderId, setMoveFolderId] = useState();
  const [folderList, setFolderList] = useState([]);
  const [folderName, setFolderName] = useState('');
  const [selectFolderId, setSelectFolderId] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [hasSelected, setHasSelected] = useState(selectedRowKeys.length > 0);
  const [includeBulk, setIncludeBulk] = useState(false);
  const [responsive, setResponsive] = useState(false);
  const [tableState, setTableState] = useState({});

  // const searchInput = useRef<Input>(null)
  const refSearchInput = useRef();
  const refSearchInputTable = useRef();

  const treeProps = {
    treeData,
    value: treeValue,
    onChange: (value) => {console.log(value);setTreeValue(value);},
    treeCheckable: true,
    showArrow: true,
    showCheckedStrategy: SHOW_PARENT,
    placeholder: '부서 또는 직원 검색',
    size: 'large',
    style: {
      width: '100%',
      marginTop: '10px'
    },
  };

  // 폴더 추가
  const addFolder = () => {
    setLoadingFolder(true);
    if (folderName ) {
      let params = {
        user: _id,
        folderName: folderName
      }
      axios.post('/api/folder/createFolder', params).then(response => {
        console.log(response.data);
        fetchFolders(params);
        setFolderName('');
        setLoadingFolder(false);
      });
    }
  };

  // 폴더 수정
  const updateFolder = () => {
    setLoadingFolder(true);
    let params = {
      _id: selectFolderId,
      user: _id,
      folderName: manageInput
    }
    axios.post('/api/folder/updateFolder', params).then(response => {
      console.log(response.data);
      if (response.data.success) {
        fetchFolders({
          user: _id
        });
        setSelectFolderId(selectFolderId);
        selectFolder(selectFolderId);
      } else {
        message.success({content: '권한이 없습니다.', style: {marginTop: '70vh'}});
      }
      setManageModal(false);
      setLoadingFolder(false);
    });
  };

  // 폴더 삭제
  const deleteFolder = () => {
    setLoadingFolder(true);
    let params = {
      _id: selectFolderId,
      user: _id
    }
    axios.post('/api/folder/deleteFolder', params).then(response => {
      console.log(response.data);
      if (response.data.success) {
        fetchFolders({
          user: _id
        });
        setSelectFolderId('');
        selectFolder('');
      } else {
        message.success({content: '권한이 없습니다.', style: {marginTop: '70vh'}});
      }
      setManageModal(false);
      setLoadingFolder(false);
    });
  };

  // 폴더 이동
  const moveFolder = () => {
    if (moveFolderId === '') {
      message.info({content: '폴더를 선택하세요.', style: {marginTop: '70vh'}});
      return false;
    }

    let pairId = selectedRowKeys.map(item => {
      let folders = data.find(doc => doc._id === item).folders;
      let folderMe = folders.length > 0 ? folders.find(e => e.user._id === _id) : null;
      let folderId = folderMe ? folderMe._id : '';
      return {docId: item, folderId: folderId};
    });
    
    setLoading(true);
    let params = {
      user: _id,
      sourceId: pairId, // 배열 변경 - [{docId: '', folderId: ''}]
      targetId: moveFolderId,
      docIds: selectedRowKeys
    }
    axios.post('/api/folder/moveDocInFolder', params).then(response => {
      console.log(response.data);
      if (response.data.success) {
        fetch({
          user: _id,
          sortField: tableState.sorter?tableState.sorter.field:'',
          sortOrder: tableState.sorter?tableState.sorter.order:'',
          pagination,
          ...tableState.filters,
          includeBulk: includeBulk,
        });
        setSelectedRowKeys([]);
        setHasSelected(false);
      } else {
        message.success({content: '권한이 없습니다.', style: {marginTop: '70vh'}});
      }
      setMoveModal(false);
      setLoading(false);
    });
  }

  // 공유 설정
  const updateShare = () => {
    setLoadingFolder(true);
    console.log(treeValue);
    let params = {
      _id: selectFolderId,
      user: _id,
      editable: editable,
      targets: treeValue
    }
    axios.post('/api/folder/shareFolder', params).then(response => {
      console.log(response.data);
      if (response.data.success) {
        fetchFolders({
          user: _id
        });
        // 공유 설정 후 자신의 권한이 빠졌을 경우 전체 조회
        if (true) {
          setSelectFolderId(selectFolderId);
          selectFolder(selectFolderId);
        } else {
          setSelectFolderId('');
          selectFolder('');
        }
      } else {
        message.success({content: '권한이 없습니다.', style: {marginTop: '70vh'}});
      }
      setShareModal(false);
      setLoadingFolder(false);
    });
  }

  // 폴더 선택
  const selectFolder = (key) => {
    setSelectFolderId(key);
    if (key) {
      let folderInfo = folderList.find(item => item._id === key);
      let targetInfo = folderInfo.sharedTarget.filter(item => item.editable && myOrgs & myOrgs.find(e => e === item.target)); // 권한 & 공유자
      if (folderInfo.user === _id || targetInfo.length > 0) {
        setDisableLink(false);
        console.log(folderInfo.sharedTarget.map(item => item.target));

        // 코드 기반 DISP 조립
        let targetTreeValue = folderInfo.sharedTarget.map(item => {
          let disp = '';
          let data = orgs.find(e => e.DEPART_CODE === item.target);
          if (data) {
            disp = '|' + data.DEPART_NAME;
          } else {
            data = users.find(e => e.SABUN === item.target);
            if (data) disp = '|' + data.name + (data.JOB_TITLE?' '+data.JOB_TITLE:'');
          } 
          return item.target + disp;
        });
        setTreeValue(targetTreeValue);      // setTreeValue(['A11000|경영전략부', 'P2000002|이원삼 대표이사']);
        
        // 권한 표시
        setEditable(targetInfo.find(e => e.editable));
      } else {
        setDisableLink(true);
      }
      setExpandable(false);
    } else {
      setDisableLink(true);
      setExpandable(true);
    }

    // 문서 목록 조회
    fetch({
      sortField: tableState.sorter.field,
      sortOrder: tableState.sorter.order,
      pagination,
      ...tableState.filters,
      user: _id,
      folderId: key
    });
  };

  // 폴더 추가 InputText State
  const onChangeFolderName = event => {
    setFolderName(event.target.value);
  };

  // 폴더 수정 InputText State
  const onChangeManageInput = event => {
    setManageInput(event.target.value);
  };

  // 폴더 이동 InputRadio State
  const onChangeMoveFolder = e => {
    console.log('radio checked', e.target.value);
    setMoveFolderId(e.target.value);
  }

  // 폴더 수정 Modal Show
  const onClickManage = event => {
    setManageInput(folderList.find(item => item._id === selectFolderId).folderName);
    setManageModal(true);
  };

  // 공유 수정 Modal Show
  const onClickShare = event => {
    setShareModal(true);
  };

  // 폴더 수정 Modal Close
  const handleCancelManageModal = () => {
    setManageModal(false);
  };

  // 공유 수정 Modal Close
  const handleCancelShareModal = () => {
    setShareModal(false);
  };

  const handleTableChange = (pagination, filters, sorter) => {
    console.log("handleTableChange called")
    // console.log("status:"+status)
    // console.log("filters"+JSON.stringify(filters))
    // console.log("refSearchInput.current.value", refSearchInput.current.input.value);

    // TO-BE
    // [테이블 문서 검색] / [검색바 문서 검색] 구분 처리
    if (refSearchInput.current.input.value) { // 커스텀 문서 검색에 값이 있는 경우 
      console.log("커스텀 문서 검색 호출")
      let _filters = loadash.clone(filters);
      _filters.docTitle = [refSearchInput.current.input.value];

      setTableState({filters: _filters, sorter: sorter});
      setStatus(_filters.status);

      fetch({
        sortField: sorter.field,
        sortOrder: sorter.order,
        pagination,
        ..._filters,
        user: _id,
        includeBulk: includeBulk
      });
    } else {
      console.log("일반 검색 호출")
      setTableState({filters: filters, sorter: sorter});
      setStatus(filters.status)
      
      fetch({
        sortField: sorter.field,
        sortOrder: sorter.order,
        pagination,
        ...filters,
        user: _id,
        includeBulk: includeBulk
      });
    }

    // AS-IS
    // setTableState({filters: filters, sorter: sorter});
    // setStatus(filters.status)
    
    // fetch({
    //   sortField: sorter.field,
    //   sortOrder: sorter.order,
    //   pagination,
    //   ...filters,
    //   user: _id,
    //   includeBulk: includeBulk
    // });
  };

  // const insertUser = (org, users, depart_code) => {
  //   let filterUser = users.filter(e => e.DEPART_CODE === depart_code);
  //   filterUser.map(user => (
  //     org.children.push({key: user._id, value: user.SABUN + '|' + user.name + (user.JOB_TITLE ? ' ' + user.JOB_TITLE : ''), title: user.name + (user.JOB_TITLE ? ' ' + user.JOB_TITLE : '')})
  //   ));
  // };

  // const fetchTreeSelect = async (params = {}) => {
  //   let users = [];
  //   let resp = await axios.post('/api/users/list', params);
  //   if (resp.data.success) {
  //     users = resp.data.users;
  //     setUsers(resp.data.users);
  //   }
  //   resp = await axios.post('/api/users/orgList', params);
  //   if (resp.data.success) {
  //     let orgs = resp.data.orgs;
  //     let tree = [];
  //     setOrgs(orgs);

  //     let level1 = orgs.filter(e => e.PARENT_NODE_ID === '');
  //     level1.forEach(function(org) {
  //       let level2 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
  //       let org1 = {key: org.DEPART_CODE, value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
  //       insertUser(org1, users, org.DEPART_CODE);

  //       level2.forEach(function(org) {
  //         let org2 = {key: org.DEPART_CODE, value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
  //         insertUser(org2, users, org.DEPART_CODE);

  //         let level3 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
  //         level3.forEach(function(org) {
  //           let org3 = {key: org.DEPART_CODE, value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
  //           insertUser(org3, users, org.DEPART_CODE);

  //           let level4 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
  //           level4.forEach(function(org) {
  //             let org4 = {key: org.DEPART_CODE, value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
  //             insertUser(org4, users, org.DEPART_CODE);
              
  //             let level5 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
  //             level5.forEach(function(org) {
  //               let org5 = {key: org.DEPART_CODE, value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
  //               insertUser(org5, users, org.DEPART_CODE);

  //               let level6 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
  //               level6.forEach(function(org) {
  //                 let org6 = {key: org.DEPART_CODE, value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
  //                 insertUser(org6, users, org.DEPART_CODE);
                 
  //                 let level7 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
  //                 level7.forEach(function(org) {
  //                   let org7 = {key: org.DEPART_CODE, value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
  //                   insertUser(org7, users, org.DEPART_CODE);

  //                   let level8 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
  //                   level8.forEach(function(org) {
  //                     let org8 = {key: org.DEPART_CODE, value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
  //                     insertUser(org8, users, org.DEPART_CODE);

  //                     let level9 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
  //                     level9.forEach(function(org) {
  //                       let org9 = {key: org.DEPART_CODE, value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
  //                       insertUser(org9, users, org.DEPART_CODE);

  //                       let level10 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
  //                       level10.forEach(function(org) {
  //                         let org10 = {key: org.DEPART_CODE, value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
  //                         insertUser(org10, users, org.DEPART_CODE);
  //                         org9.children.push(org10);
  //                       });
  //                       org8.children.push(org9);
  //                     });
  //                     org7.children.push(org8);
  //                   });
  //                   org6.children.push(org7);
  //                 });
  //                 org5.children.push(org6);
  //               });
  //               org4.children.push(org5);
  //             });
  //             org3.children.push(org4);
  //           });
  //           org2.children.push(org3);
  //         });
  //         org1.children.push(org2);
  //       });
  //       tree.push(org1);
  //     });
  //     console.log(tree);
  //     setTreeData(tree);
  //   } else {
  //     console.log('ERROR');
  //   }
  // };

  // 사용자의 부서 정보 조회
  const fetchMyOrgs = (params = {}) => {
    axios.post('/api/users/myOrgs', params).then(response => {
      if (response.data.success) {
        setMyOrgs(response.data.orgs);
      }
    });
  };

  // 사용자별 폴더 목록 조회  
  const fetchFolders = (params = {}) => {
    axios.post('/api/folder/listFolder', params).then(response => {
      console.log(response.data.folders);
      if (response.data.success && response.data.folders.length > 0) {
        setFolderList(response.data.folders);
      }
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
          ref={refSearchInputTable}
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
          <Button onClick={() => handleReset(clearFilters, confirm)} size="small" style={{ width: 90 }}>
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
          // highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text : ''}
        />
      ) : (
        text
      ),
  });

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    // console.log('handleSearch called', selectedKeys, dataIndex)
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  }

  const handleReset = (clearFilters, confirm) => {
    // console.log('handleReset called')
    clearFilters();
    setSearchText('');
    confirm();
  }

  const description = (
    <div>
      <table width='100%' style={{tableLayout:'fixed'}}>
      <tbody>
        <tr>
          <td align='left' width='350px'>
            <b><Badge status="processing" text={DOCUMENT_TODO} /></b> : 본인의 서명 또는 수신이 필요한 문서<br></br>
            <b><Badge color="#9694ff" text={DOCUMENT_SIGNING} /></b> : 다른 서명 참여자의 서명이 진행 중인 문서<br></br>
            <b><Badge status="error" text={DOCUMENT_CANCELED} /></b> : 서명 참여자 중 서명을 취소한 문서 <br></br>
            <b><Badge status="success" text={DOCUMENT_SIGNED} /></b> : 모든 서명 참여자의 서명이 완료된 문서 
          </td>
          <td align='right'>
          <img src={responsive? banner_small : banner} width={responsive ? "100px" : "500px"} />
          </td>
        </tr>
      </tbody>
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
  
  const rowSelection = {
    selectedRowKeys,
    onChange : selectedRowKeys => {
      console.log('selectedRowKeys changed: ', selectedRowKeys);
      setSelectedRowKeys(selectedRowKeys);
      setHasSelected(selectedRowKeys.length > 0);
    }
  };

  const columns = [
    {
      title: '문서명',
      dataIndex: 'docTitle',
      sorter: true,
      key: 'docTitle',
      ...getColumnSearchProps('docTitle'),
      expandable: true,
      render: (text,row) =>  <div style={{ wordWrap: 'break-word', wordBreak: 'break-word' }}><FileOutlined /> 
      
      {searchedColumn === 'docTitle' ? (
        
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      )}

       {row['attachFiles']?.length > 0 && <PaperClipOutlined /> }</div>, // 여러 필드 동시 표시에 사용
      // render: (text,row) =>  <Typography.Paragraph editable style={{ wordWrap: 'break-word', wordBreak: 'break-word' }}><FileOutlined /> {text}</Typography.Paragraph>, // 여러 필드 동시 표시에 사용
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
      width: responsive ? '87px' : '113px',
      ...getColumnSearchProps('name'),
      onFilter: (value, record) =>
      record['user']['name']
        ? record['user']['name'].toString().toLowerCase().includes(value.toLowerCase())
        : '',
      render: (text, row) => {
        return (
          <React.Fragment>
            {responsive ? row['user']['name'] : row['user']['name'] + ' ' + row['user']['JOB_TITLE']}
          {/* {row['user']['name']} {row['user']['JOB_TITLE']} */}
          </React.Fragment>
        )
      } 
    },
    // {
    //   title: '요청자',
    //   responsive: ["xs"],
    //   dataIndex: ['user', 'name'],
    //   // sorter: (a, b) => a.user.name.localeCompare(b.user.name),  // Populate Collection 단위로 정렬되고, 전체 Collection에 적용 안되어 대안 필요
    //   sorter: false,
    //   key: 'name',
    //   ...getColumnSearchProps('name'),
    //   onFilter: (value, record) =>
    //   record['user']['name']
    //     ? record['user']['name'].toString().toLowerCase().includes(value.toLowerCase())
    //     : '',
    //   render: (text, row) => {
    //       return (
    //         <React.Fragment>
    //         {row['user']['name']}
    //         <br />
    //         <font color='#787878'>{moment(row["recentTime"]).fromNow()}</font>
    //         </React.Fragment>
    //       )
    //   } 
    // },
    {
      title: '참여자',
      responsive: ["xl"],
      dataIndex: ['users'],
      key: 'users',
      width: '120px',
      render: (users, row) => {
        return (
          <React.Fragment>
            {users?.length > 1 ? <Tooltip placement="top" title={row.users.map((user, index) => ( user.name+' '+user.JOB_TITLE+ (index==users.length-1 ? '' : ', ')  ))}>{users[0].name +' '+ '외 '+ (users.length -1) + '명'}</Tooltip> : users[0]?.name +' '+ (users[0]?.JOB_TITLE?users[0]?.JOB_TITLE:'')}
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
    // 폴더관리 부분
    {
      title: responsive ? '활동' : '최근 활동',
      dataIndex: 'recentTime',
      responsive: ["sm"],
      sorter: true,
      key: 'recentTime',
      width: responsive ? '90px' : '145px',
      render: (text, row) => {
        return responsive ?  <font color='#787878'>{moment(row["recentTime"]).fromNow()}</font> : <font color='#787878'><Moment format='YY/MM/DD HH:mm'>{row["recentTime"]}</Moment></font>
          // return <Moment format='YYYY/MM/DD HH:mm'>{row["requestedTime"]}</Moment>
          // return (<font color='#787878'>{moment(row["recentTime"]).fromNow()}</font>)
      } 
    },
    {
      title: '폴더',
      dataIndex: 'folders',
      responsive: ['xl'],
      width: '150px',
      render: (obj) => {
        let result = obj.filter(elem => elem.user._id === _id || elem.sharedTarget.find(item => item.editable && myOrgs && myOrgs.find(e => e === item.target)));
        return result.map(item => (
          <Space>
            {item.user._id === _id ? <FolderOpenTwoTone /> : <FolderOpenFilled />}
            <Typography.Link
              onClick={(event)=>{
                event.stopPropagation();
                navigate('/inFolder', {state: {folderInfo: item, backUrl: '/documentList'}});
              }}
            >{item.folderName}</Typography.Link>
            {item.shared ? <TeamOutlined /> : ''}
          </Space>
        ));
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
                const isWithPDF = row["isWithPDF"]
                const attachFiles = row["attachFiles"]
                dispatch(setDocToView({ docRef, docId, docType, docTitle, isWithPDF, attachFiles }));
                navigate('/viewDocument', { state: {pagination: pagination}});
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
                const downloads = row["downloads"]
                const status = DOCUMENT_SIGNED
                const isWithPDF = row["isWithPDF"]
                const attachFiles = row["attachFiles"]
                dispatch(setDocToView({ docRef, docId, docType, docTitle, status, downloads, isWithPDF, attachFiles}));
                navigate('/viewDocument', { state: {pagination: pagination}});
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
                const attachFiles = row["attachFiles"];
                const items = row["items"];
                const isWithPDF = row["isWithPDF"];
                const docTitle = row["docTitle"]
                dispatch(setDocToSign({ docRef, docId, docType, docUser, observers, orderType, usersTodo, usersOrder, attachFiles, items, isWithPDF, docTitle }));
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
                const isWithPDF = row["isWithPDF"]
                const attachFiles = row["attachFiles"]
                dispatch(setDocToView({ docRef, docId, docType, docTitle, isWithPDF, attachFiles }));
                navigate('/viewDocument', { state: {pagination: pagination}});
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
                const isWithPDF = row["isWithPDF"]
                const attachFiles = row["attachFiles"]
                dispatch(setDocToView({ docRef, docId, docType, docTitle, isWithPDF, attachFiles }));
                navigate('/viewDocument', { state: {pagination: pagination}});
              }}></Button>
              </Tooltip>
            )
          case DOCUMENT_SIGNED:
            return (
              <div>
              <Tooltip placement="top" title={'문서 보기'}><Button
                // loading={isUploading(row)}
                key="1"
                icon={<FileOutlined />}
                onClick={() => {        
                const docId = row["_id"]
                const docRef = row["docRef"]
                const docType = row["docType"]
                const docTitle = row["docTitle"]
                const downloads = row["downloads"]
                const status = DOCUMENT_SIGNED
                const isWithPDF = row["isWithPDF"]
                const attachFiles = row["attachFiles"]
                dispatch(setDocToView({ docRef, docId, docType, docTitle, status, downloads, isWithPDF, attachFiles }));
                // navigate('/viewDocument', { state: {pagination:pagination, from: 'documentList'}});
                console.log('pagination called', pagination);
                navigate('/viewDocument', { state: {pagination: pagination}});

                
              }}></Button></Tooltip>&nbsp;&nbsp;
              {/* <a href={row["docRef"]} download={row["docTitle"]+'.pdf'}> */}
              <Tooltip placement="top" title={'다운로드'}>
                <Badge count={row['downloads'].find(e => e === _id)?<CheckCircleTwoTone/>:0}>
                <Button key="2" href={'/api/storage/documents/'+row["_id"]} download={row["docTitle"]+'.pdf'} icon={<DownloadOutlined />} loading={loadingDownload[row["_id"]]}  onClick={(e) => {
                // <Button key="2" href={row["docRef"]} download={row["docTitle"]+'.pdf'} icon={<DownloadOutlined />} loading={loadingDownload[row["_id"]]}  onClick={(e) => {
                  row['downloads'].push(_id);
                  axios.post('/api/document/updateDownloads', {docId:row['_id'], usrId:_id});
                  setLoadingDownload( { [row['_id']] : true } );
                  setTimeout(() => {
                    setLoadingDownload( { [row['_id']] : false } );
                  }, 3000);
                }}>
                </Button>
                </Badge>
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
                const attachFiles = row["attachFiles"];
                const items = row["items"];
                const isWithPDF = row["isWithPDF"];
                const docTitle = row["docTitle"]
                dispatch(setDocToSign({ docRef, docId, docType, docUser, observers, orderType, usersTodo, usersOrder, attachFiles, items, isWithPDF, docTitle }));
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
                const isWithPDF = row["isWithPDF"]
                const attachFiles = row["attachFiles"]
                dispatch(setDocToView({ docRef, docId, docType, docTitle, isWithPDF, attachFiles }));
                navigate('/viewDocument', { state: {pagination: pagination}});
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

    // 좌측 메뉴 선택
    dispatch(setPathname('/documentList'));

    console.log("useEffect called")
    console.log("includeBulk:"+location.state.includeBulk)
    console.log('pagination', location.state.pagination)
    // 뒤로 가기로 왔을때는 화면 재로딩을 하지 않도록 한다.
    // let _pagination = {current:3, pageSize:10, showSizeChanger:true, pageSizeOptions: ["10", "20", "30"]};
    // if (location.state.from === 'viewDocument') {
    //   console.log('hello')
    //   _pagination = {current:3, pageSize:10, showSizeChanger:true, pageSizeOptions: ["10", "20", "30"]};
    //   setPagination({current:3, pageSize:10, showSizeChanger:true, pageSizeOptions: ["10", "20", "30"]})
    //   pagination.current = 3;
    // };

    // 폴더관리 부분
    fetchFolders({
      user: _id,
      includeOption: true
    });

    fetchMyOrgs({
      user: _id
    });

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

    // fetchTreeSelect({
    //   OFFICE_CODE: '7831'
    // });
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


  // TODO : 기본 Search 와 연동되게 하기 ... 지금은 페이지 따로 논다 .
  const onSearch = (value) => {
    console.log('onSearch called', value);
    console.log('tableState', tableState);

    let filters;
    if (tableState.filters) {
      filters = loadash.cloneDeep(tableState.filters);
      filters.docTitle = [value];
    } else {
      filters = {status:[], docTitle: [value]} 
    }

    console.log('filters', filters);

    setTableState({filters: filters, sorter: tableState?.sorter});
    setSearchText(value);
    setSearchedColumn('docTitle');
    
    fetch({
      sortField: tableState?.sorter?.field,
      sortOrder: tableState?.sorter?.order,
      pagination,
      ...filters,
      user: _id,
      includeBulk: includeBulk
      // status:status  //필터에 포함되어 있음 
    });


  }

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
            <Checkbox key={uuidv4()} checked={includeBulk} onChange={(e) => {setIncludeBulk(e.target.checked)}}>대량 전송 포함</Checkbox>,
            <Button key={uuidv4()} icon={<FileAddOutlined />} type="primary" onClick={() => {
              dispatch(resetAssignAll());
              dispatch(setSendType('G'));
              // dispatch(setDocumentType('PC'));  // PC 탭 먼저 선택
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
      <div>
      <Space style={{margin: '15px 0px', float: 'left'}}>
        {`선택한 문서 (${selectedRowKeys.length})`}
        <Typography.Link disabled={!hasSelected} onClick={()=>{setMoveFolderId('');setMoveModal(true);}}><FolderOpenOutlined /> 이동</Typography.Link>
      </Space>

      <div style={{textAlign: 'right'}}><Search ref={refSearchInput} onSearch={onSearch} placeholder="문서명 검색" allowClear style={{width: '220px', marginTop:'10px'}} /></div>
      </div>
      
      {/* {hasSelected ? 
        (<Space style={{margin: '15px 0px'}}>
          {`선택한 문서 (${selectedRowKeys.length})`}<Typography.Link onClick={onClickMove}><FolderTwoTone /> 폴더로 이동</Typography.Link>
          <Typography.Link onClick={onClickMove}><DeleteTwoTone /> 폴더에서 삭제</Typography.Link>
        </Space>)
      :
        (<Space style={{margin: '10px 0px'}}>
        <Select
          style={{ width: 200 }}
          // placeholder={<Space><FolderOpenTwoTone />폴더 선택</Space>}
          dropdownRender={optionList => (
            <>
              {optionList}
              <Divider style={{ margin: '8px 0' }} />
              <Space align="center" style={{ padding: '0 8px 4px' }}>
                <Input placeholder="폴더명" value={folderName} onChange={onChangeFolderName}/>
                <Typography.Link onClick={addFolder} style={{ whiteSpace: 'nowrap' }}>
                  <FolderAddTwoTone /> 추가
                </Typography.Link>
              </Space>
            </>
          )}
          onChange={selectFolder}
          onPressEnter={(e)=>{console.log(e)}}
          loading={loadingFolder}
          value={selectFolderId}
        >
          {folderList.map(folder => (
            <Option key={folder._id}><Space size="small">{folder.user === _id ? <FolderOpenTwoTone /> : <FolderOpenOutlined />}{folder.folderName}{folder.shared?<TeamOutlined/>:''}</Space></Option>
          ))}
        </Select>
        <Space size={"middle"}>
          <Typography.Link disabled={disableLink} onClick={onClickManage}><SettingOutlined /> 수정</Typography.Link>
          <Typography.Link disabled={disableLink} onClick={onClickShare}><TeamOutlined /> 공유</Typography.Link>
        </Space>
      </Space>)
      } */}
      <RcResizeObserver
        key="resize-observer"
        onResize={(offset) => {
          setResponsive(offset.width < 1280);
        }}
      >
      <Table
        rowKey={ item => { return item._id } }
        columns={columns}
        dataSource={data}
        pagination={pagination}
        loading={loading}
        rowSelection={rowSelection}
        // expandable={expandableData}
        defaultExpandedRowKeys={[location.state.docId]}
        expandedRowRender={expandable ? row => <DocumentExpander item={row} /> : null}
        expandRowByClick={expandable}
        onRow={record => ({
          onClick: e => {
            // console.log(`user clicked on row ${record.t1}!`);
          }
        })}
        onChange={handleTableChange}
      />
      </RcResizeObserver>

    </PageContainer>
    <Modal
      visible={manageModal}
      width={400}
      title="폴더 수정"
      onCancel={handleCancelManageModal}
      footer={[
        <Button type="primary" onClick={updateFolder}>
          수정
        </Button>,
        <Button danger onClick={deleteFolder}>
          삭제
        </Button>
      ]}
    >
      <Input size="large" allowClear prefix={<FolderOpenTwoTone />} value={manageInput} onChange={onChangeManageInput}/>
    </Modal>
    <Modal
      visible={moveModal}
      width={360}
      title="폴더 선택"
      onCancel={()=>{setMoveModal(false)}}
      footer={[
        <Button key={uuidv4()} type="primary" onClick={moveFolder}>
          이동
        </Button>
      ]}
      bodyStyle={{textAlign: 'Center'}}
    >
      <Radio.Group onChange={onChangeMoveFolder} value={moveFolderId} buttonStyle="solid" style={{textAlign: 'left'}}>
        <Space direction="vertical">
          {folderList && folderList.length > 0 ?
            folderList && folderList.filter(e => e._id!=='').map(folder => (
              <Radio.Button key={uuidv4()} style={{width:'100%'}} value={folder._id} disabled={(folder.user._id===_id || folder.sharedTarget.find(item => item.editable && myOrgs && myOrgs.find(e => e === item.target)))?false:true}>
                <Tooltip placement="top" title={(folder.user._id===_id || folder.sharedTarget.find(item => item.editable && myOrgs && myOrgs.find(e => e === item.target)))?'':'권한이 없습니다.'}>
                  <Space size="small">{folder.user._id === _id ? <FolderOpenTwoTone /> : <FolderOpenFilled />}<CardTitle>{folder.folderName}</CardTitle>{folder.shared?<TeamOutlined/>:''}</Space>
                </Tooltip>
              </Radio.Button>
            ))
          :
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span>폴더가 없습니다.</span>} style={{margin: '0'}}/>
          }
        </Space>
      </Radio.Group>
      <Typography.Paragraph level={5} style={{marginTop: '1.5rem'}}>
        <Space><FolderOpenTwoTone />개인 폴더<br/><FolderOpenFilled />공유 받은 폴더<br/><TeamOutlined />공유 표시</Space>
      </Typography.Paragraph>
    </Modal>
    <Modal
      visible={shareModal}
      width={400}
      title="공유 설정"
      onCancel={handleCancelShareModal}
      footer={[
        <Button type="primary" onClick={updateShare}>
          설정
        </Button>
      ]}
    >
      <Switch
        checkedChildren="수정 권한"
        unCheckedChildren="수정 권한"
        checked={editable}
        onChange={() => setEditable(!editable)}
      />
      <TreeSelect {...treeProps} />
    </Modal>
    </div>
    
  );
};

export default DocumentList;
