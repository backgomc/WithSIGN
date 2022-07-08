import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { TreeSelect } from 'antd';

const { SHOW_PARENT } = TreeSelect;

const UserSelector = ({setValue, _defaultValue}) => {

  const [treeData, setTreeData] = useState();
  const [treeValue, setTreeValue] = useState();
  const [defaultValue, setDefaultValue] = useState(_defaultValue);
  // const [users, setUsers] = useState([]);
  // const [orgs, setOrgs] = useState([]);

  const treeProps = {
    treeData,
    value: treeValue,
    onChange: (value) => {console.log(value);setTreeValue(value);setValue(value)},
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
      org.children.push({key: user._id, value: user.SABUN + '|' + user.name + (user.JOB_TITLE ? ' ' + user.JOB_TITLE : ''), title: user.name + (user.JOB_TITLE ? ' ' + user.JOB_TITLE : '')})
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

  return (
    <div>
      <TreeSelect {...treeProps} style={{width:'100%'}} />
    </div>
  );
};

export default UserSelector;