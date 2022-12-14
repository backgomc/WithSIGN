import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectIncludeOption, selectUser, setIncludeOption } from '../../app/infoSlice';
import { navigate } from '@reach/router';
import { useIntl } from 'react-intl';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/ko';
import { Tooltip, Modal, Input, Space, Button, List, TreeSelect, message, Switch, Checkbox, Typography, Badge } from 'antd';
import { SettingOutlined, TeamOutlined, FolderOpenTwoTone, WarningFilled } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-layout';
import RcResizeObserver from 'rc-resize-observer';
import ProCard from '@ant-design/pro-card';
import 'antd/dist/antd.css';
import '@ant-design/pro-list/dist/list.css';
import '@ant-design/pro-card/dist/card.css';
import '@ant-design/pro-form/dist/form.css';
import feB from '../../assets/images/folder_empty_B.png'
import feG from '../../assets/images/folder_empty_G.png'
import fcB from '../../assets/images/folder_contain_B.png'
import fcG from '../../assets/images/folder_contain_G.png'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserGroup, faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components';

const CardTitle = styled.div`
  width: 180px;
  height: 2.3em;
  line-height: 1.2em;
  text-align: center;
  text-overflow: ellipsis;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

moment.locale('ko');
const { SHOW_PARENT } = TreeSelect;

const FolderList = () => {
  
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const includeOption = useSelector(selectIncludeOption);
  const user = useSelector(selectUser);
  const { _id } = user;
  const refFolderName = useRef();
  const [users, setUsers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [myOrgs, setMyOrgs] = useState();
  const [treeValue, setTreeValue] = useState();
  const [treeData, setTreeData] = useState();
  const [manageModal, setManageModal] = useState(false);
  const [shareModal, setShareModal] = useState(false);
  const [editable, setEditable] = useState(false);
  const [folderList, setFolderList] = useState([]);
  const [folderName, setFolderName] = useState('');
  const [selectFolderId, setSelectFolderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [responsive, setResponsive] = useState(false);
  const [btnDisabled, setBtnDisabled] = useState(true);

  const treeProps = {
    treeData,
    value: treeValue,
    onChange: (value) => {console.log(value);setTreeValue(value);},
    treeCheckable: true,
    showArrow: true,
    showCheckedStrategy: SHOW_PARENT,
    placeholder: '부서 또는 직원 검색',
    size: 'middle',
    style: {
      width: '90%',
      marginTop: '10px'
    },
  };

  // 폴더 추가
  const addFolder = () => {
    setLoading(true);
    if (folderName) {
      let params = {
        user: _id,
        folderName: folderName,
        includeOption: includeOption
      }
      axios.post('/api/folder/createFolder', params).then(response => {
        console.log(response.data);
        fetchFolders(params);
        setManageModal(false);
      });
    } else {
      refFolderName.current.focus();
    }
  };

  // 폴더 수정
  const updateFolder = () => {
    setLoading(true);
    let params = {
      _id: selectFolderId,
      user: _id,
      folderName: folderName,
      includeOption: includeOption
    }
    axios.post('/api/folder/updateFolder', params).then(response => {
      console.log(response.data);
      if (response.data.success) {
        fetchFolders(params);
      } else {
        message.success({content: '권한이 없습니다.', style: {marginTop: '70vh'}});
      }
      setManageModal(false);
    });
  };

  // 폴더 삭제
  const deleteFolder = () => {
    setLoading(true);
    let params = {
      _id: selectFolderId,
      user: _id,
      includeOption: includeOption
    }
    axios.post('/api/folder/deleteFolder', params).then(response => {
      console.log(response.data);
      if (response.data.success) {
        fetchFolders(params);
      } else {
        message.success({content: '권한이 없습니다.', style: {marginTop: '70vh'}});
      }
      setManageModal(false);
    });
  };

  // 공유 설정
  const updateShare = () => {
    setLoading(true);
    let params = {
      _id: selectFolderId,
      user: _id,
      includeOption: includeOption,
      editable: editable,
      targets: treeValue
    }
    axios.post('/api/folder/shareFolder', params).then(response => {
      console.log(response.data);
      if (response.data.success) {
        fetchFolders(params);
      } else {
        message.success({content: '권한이 없습니다.', style: {marginTop: '70vh'}});
      }
      setShareModal(false);
      setLoading(false);
    });
  }

  // 폴더 수정 InputText State
  const onChangeFolderName = event => {
    setFolderName(event.target.value);
  };

  // 폴더 Modal Show
  const onClickManage = (item) => {
    // if (item._id === 'DEFAULT') {
    //   setSelectFolderId('');
    //   setFolderName('');
    // } else {
      setSelectFolderId(item._id);
      setFolderName(item.folderName);
    // }
    setManageModal(true);
  };

  // 공유 Modal Show
  const onClickShare = (item) => {
    setSelectFolderId(item._id);

    // 코드 기반 DISP 조립
    let targetTreeValue = item.sharedTarget.map(element => {
      let disp = '';
      let data = orgs.find(e => e.DEPART_CODE === element.target);
      if (data) {
        disp = '|' + data.DEPART_NAME;
      } else {
        data = users.find(e => e.SABUN === element.target);
        if (data) disp = '|' + data.name + (data.JOB_TITLE?' '+data.JOB_TITLE:'');
      } 
      return element.target + disp;
    });
    setTreeValue(targetTreeValue);      // setTreeValue(['A11000|경영전략부', 'P2000002|이원삼 대표이사']);

    // 권한 표시
    setEditable(item.sharedTarget.find(e => e.editable)?true:false);
    
    setShareModal(true);
  };

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
    setLoading(true);
    axios.post('/api/folder/listFolder', params).then(response => {
      console.log(response.data.folders);
      setFolderList(response.data.folders);
      setLoading(false);
    });
  };

  // 전체부서 트리 구조 조회
  const fetchTreeSelect = async (params = {}) => {
    let users = [];
    let resp = await axios.post('/api/users/list', params);
    if (resp.data.success) {
      users = resp.data.users;
      setUsers(resp.data.users);
    }
    resp = await axios.post('/api/users/orgList', params);
    if (resp.data.success) {
      let orgs = resp.data.orgs;
      let tree = [];
      setOrgs(orgs);

      let level1 = orgs.filter(e => e.PARENT_NODE_ID === '');
      level1.forEach(function(org) {
        let level2 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
        let org1 = {value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
        insertUser(org1, users, org.DEPART_CODE);

        level2.forEach(function(org) {
          let org2 = {value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
          insertUser(org2, users, org.DEPART_CODE);

          let level3 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
          level3.forEach(function(org) {
            let org3 = {value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
            insertUser(org3, users, org.DEPART_CODE);

            let level4 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
            level4.forEach(function(org) {
              let org4 = {value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
              insertUser(org4, users, org.DEPART_CODE);
              
              let level5 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
              level5.forEach(function(org) {
                let org5 = {value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
                insertUser(org5, users, org.DEPART_CODE);

                let level6 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
                level6.forEach(function(org) {
                  let org6 = {value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
                  insertUser(org6, users, org.DEPART_CODE);
                 
                  let level7 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
                  level7.forEach(function(org) {
                    let org7 = {value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
                    insertUser(org7, users, org.DEPART_CODE);

                    let level8 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
                    level8.forEach(function(org) {
                      let org8 = {value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
                      insertUser(org8, users, org.DEPART_CODE);

                      let level9 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
                      level9.forEach(function(org) {
                        let org9 = {value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
                        insertUser(org9, users, org.DEPART_CODE);

                        let level10 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE);
                        level10.forEach(function(org) {
                          let org10 = {value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: []}
                          insertUser(org10, users, org.DEPART_CODE);
                          org9.children.push(org10);
                        });
                        org8.children.push(org9);
                      });
                      org7.children.push(org8);
                    });
                    org6.children.push(org7);
                  });
                  org5.children.push(org6);
                });
                org4.children.push(org5);
              });
              org3.children.push(org4);
            });
            org2.children.push(org3);
          });
          org1.children.push(org2);
        });
        tree.push(org1);
      });
      console.log(tree);
      setTreeData(tree);
    } else {
      console.log('ERROR');
    }
    setBtnDisabled(false);
  };

  const insertUser = (org, users, depart_code) => {
    let filterUser = users.filter(e => e.DEPART_CODE === depart_code);
    filterUser.map(user => (
      org.children.push({value: user.SABUN + '|' + user.name + (user.JOB_TITLE ? ' ' + user.JOB_TITLE : ''), title: user.name + (user.JOB_TITLE ? ' ' + user.JOB_TITLE : '')})
    ));
  };

  useEffect(() => {
    console.log('useEffect()');
    fetchMyOrgs({
      user: _id
    });
    fetchTreeSelect({
      OFFICE_CODE: '7831'
    });
    fetchFolders({
      user: _id,
      includeOption: includeOption
    });
  }, [includeOption]);

  const actionItems = (item) => {
    let disabled = !(item.user._id===_id||item.sharedTarget.find(item => item.editable && myOrgs && myOrgs.find(e => e === item.target)));
    // if (item._id === 'DEFAULT') {
    //   return [
    //     <Tooltip placement="bottom" title={'기본 폴더는 수정, 공유가 불가능합니다.'}>
    //       <Button key={uuidv4()} disabled={true} type="text" icon={<DatabaseOutlined />} ></Button>
    //     </Tooltip>
    //     ];
    // } else {
      return [
        <Tooltip placement="bottom" title={disabled?'권한이 없습니다.':''}>
          <Button key={uuidv4()} type="text" disabled={disabled} icon={<SettingOutlined />} onClick={(e)=>{e.stopPropagation();onClickManage(item)}}>설정</Button>
        </Tooltip>,
        <Tooltip placement="bottom" title={disabled?'권한이 없습니다.':''}>
          <Button loading={btnDisabled} key={uuidv4()} type="text" disabled={disabled} icon={<TeamOutlined />} onClick={(e)=>{e.stopPropagation();onClickShare(item)}}>공유</Button>
        </Tooltip>
      ];
    // }
  }

  const CustomDiv = (item) => {
    let bgImg = feB;
    if (item.user._id !== _id ) bgImg = feG;
    
    let bIcon = '';
    if (item.shared) {
      bIcon = (
        <div style={{color: 'white', textAlign: 'center'}}>
          <span><FontAwesomeIcon icon={faUserGroup} style={{fontSize: '2rem', marginTop: '2rem'}} /></span>
        </div>
      )
    }

    return (
      <Badge count={item.docs?item.docs.length:0} style={{ backgroundColor: '#519be3' }}>
        <div style={{
          backgroundImage: 'url('+bgImg+')',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: '80%',
          justifyContent: 'center',
          alignItems: 'center',
          width: '180px',
          height: '180px',
          display: 'flex'
        }}>
          {bIcon}
        </div>
        <div style={{fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.3rem'}}><CardTitle>{item.folderName}</CardTitle></div>
      </Badge>
    )
  }

  return (
    <div>
      <PageContainer
          ghost
          header={{
            title: formatMessage({id: 'folder.management'}),
            ghost: false,
            breadcrumb: {
              routes: [],
            },
            extra: [<Checkbox key={uuidv4()} checked={includeOption} onChange={(e) => {dispatch(setIncludeOption(e.target.checked))}}>공유 받은 폴더 표시</Checkbox>]
          }}
          content={'폴더를 관리하고 공유할 수 있습니다.'}
          footer={[
          ]}
      >
        <br></br>
        <RcResizeObserver
          key="resize-observer"
          onResize={(offset) => {
            setResponsive(offset.width < 1280);
          }}
        >
          <List
            rowKey="id"
            grid={{ gutter: 24, lg: 3, md: 2, sm: 1, xs: 1 }}
            dataSource={[{'_id': ''}, ...folderList]}
            loading={loading}
            renderItem={item => (item._id ?
              (
              <List.Item key={item._id}>
                <ProCard 
                  hoverable
                  bordered
                  layout="center"
                  direction="column"
                  style={{ minWidth: '180px', height: '100%' }}
                  bodyStyle={{ padding: '5px'}}
                  actions={actionItems(item)}
                  onClick={e => {navigate('/inFolder', {state: {folderInfo: item}})}}
                >
                  {CustomDiv(item)}
                </ProCard>
              </List.Item>
              ) : (
              <List.Item>
                <Button key={uuidv4()} type="dashed" style={{ height: '290px', width: '100%', minWidth: '190px' }} onClick={()=>{onClickManage(item)}}>
                  <FontAwesomeIcon icon={faPlusCircle} style={{fontSize: '3rem'}} />
                </Button>
              </List.Item>
              )
            )}
          />
        </RcResizeObserver>
      </PageContainer>
      <Modal
        open={manageModal}
        width={480}
        title="폴더"
        onCancel={()=>{setManageModal(false)}}
        footer={
          selectFolderId ? 
          [<Button key={uuidv4()} type="primary" onClick={updateFolder}>
            수정
          </Button>,
          <Button key={uuidv4()} type="primary" danger onClick={deleteFolder}>
            삭제
          </Button>]
          :
          [<Button key={uuidv4()} type="primary" onClick={addFolder}>
            등록
          </Button>]
        }
      >
        <Input size="large" allowClear prefix={<FolderOpenTwoTone />} value={folderName} onChange={onChangeFolderName} placeholder="폴더명을 입력하세요." ref={refFolderName} />
        {selectFolderId ? <Space style={{padding: '13px 0px 0px 13px'}}><WarningFilled style={{color: 'orange'}} /><Typography.Text type="warning">폴더 삭제 시 문서는 [내 문서함]에서 확인할 수 있습니다.</Typography.Text></Space> : <></>}
      </Modal>
      <Modal
        open={shareModal}
        width={480}
        title="공유"
        onCancel={()=>{setShareModal(false)}}
        footer={[
          <Button key={uuidv4()} type="primary" onClick={updateShare}>
            저장
          </Button>
        ]}
      >
        <Space>
          <Typography.Text>공유자 권한</Typography.Text>
          <Switch
            checkedChildren="문서 수정 및 폴더 설정 가능"
            unCheckedChildren="문서 읽기만 가능"
            checked={editable}
            onChange={() => setEditable(!editable)}
          />
        </Space>
        <TreeSelect {...treeProps} />
      </Modal>
    </div>
  );
};

export default FolderList;
