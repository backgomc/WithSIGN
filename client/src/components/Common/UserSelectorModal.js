import React, { useEffect, useState } from 'react';
import { TreeSelect, Modal, Button, message } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const { SHOW_PARENT } = TreeSelect;

const UserSelectorModal = ({showModal, setShowModal, selectUsers, setSelectUsers, userKey, signees}) => {

  const [treeData, setTreeData] = useState();
  const [treeValue, setTreeValue] = useState();
  const [defaultValue, setDefaultValue] = useState();
  // const [users, setUsers] = useState([]);
  // const [orgs, setOrgs] = useState([]);

  const treeProps = {
    treeData,
    value: treeValue,
    onChange: (value) => {console.log(value);setTreeValue(value)},
    // treeCheckable: true,
    showSearch: true,
    // multiple: false,
    showArrow: true,
    showCheckedStrategy: SHOW_PARENT,
    placeholder: '임직원 검색',
    size: 'middle',
    // defaultValue: "P1010008|박세현 차장",
    defaultValue: defaultValue,
    style: {
      width: '90%',
      marginTop: '10px'
    },
  };

  useEffect(() => {
    fetchTreeSelect({
      OFFICE_CODE: '7831'
    });

  }, []);

  useEffect(() => {
    setTreeValue(selectUsers.filter(el => el.key === userKey)[0]?.value);
  }, [userKey]);

  // 전체부서 트리 구조 조회
  const fetchTreeSelect = async (params = {}) => {
    let users = [];
    let resp = await axios.post('/api/users/list', params);
    if (resp.data.success) {
      users = resp.data.users;
      // setUsers(resp.data.users);
    }
    resp = await axios.post('/api/users/orgList', params);
    if (resp.data.success) {
      let orgs = resp.data.orgs;
      let tree = [];
      // setOrgs(orgs);

      const level1 = orgs.filter(e => e.PARENT_NODE_ID === "")
      level1.forEach(org => {
        const org1 =  {key: org.DEPART_CODE, value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: [], selectable: false }
        insertUser(org1, users, org.DEPART_CODE)

        const level2 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE)
        if (level2) {
          dfs(org1, level2, users, orgs)
        }
        
        tree.push(org1)
      })

      setTreeData(tree);
    } else {
      console.log('ERROR');
    }
  };

  const insertUser = (org, users, depart_code) => {
    let filterUser = users.filter(e => e.DEPART_CODE === depart_code);
    filterUser.map(user => (
      org.children.push({key: user._id, value: user._id + '|' + user.SABUN + '|' + user.name + (user.JOB_TITLE ? ' ' + user.JOB_TITLE : ''), title: user.name + (user.JOB_TITLE ? ' ' + user.JOB_TITLE : '')})
    ));
  };


  const dfs = (currentOrg, level, users, orgs) => {
    level.forEach(org => {
      const current = {key: org.DEPART_CODE, value: org.DEPART_CODE + '|' + org.DEPART_NAME, title: org.DEPART_NAME, children: [], selectable: false}
      insertUser(current, users, org.DEPART_CODE)

      currentOrg.children?.push(current)

      const subLevel = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE)
      if (subLevel && subLevel.length > 0) {
        dfs(current, subLevel, users, orgs)
      }
    })  
  }

  const selectUser = () => {
    
    console.log('treeValue', treeValue);
    console.log('selectUsers', selectUsers);
    console.log('userKey', userKey);

    // 참여자 중복 방지
    if (selectUsers.some(el => el.value === treeValue)) {
      message.error('이미 참여자에 동일인이 있습니다.');
      return;
    }

    // 이미 지정된 참여자 중복 방지
    if (signees.some(el => treeValue.includes(el.key))) {
      message.error('이미 참여자에 동일인이 있습니다.');
      return;
    }

    setSelectUsers([...selectUsers.filter(el => el.key !== userKey), {'key': userKey, 'value':treeValue}])
    setShowModal(false);
  }
  
  return (
    <Modal
    visible={showModal}
    width={480}
    title="사용자 선택"
    onCancel={()=>{setShowModal(false)}}
    footer={[
      <Button key={uuidv4()} type="primary" onClick={selectUser}>
        선택
      </Button>
    ]}
  >
    <TreeSelect {...treeProps} style={{width:'100%'}} />
  </Modal>
  );
};

export default UserSelectorModal;