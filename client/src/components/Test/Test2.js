import React, { useEffect, useState } from 'react';
import { EllipsisOutlined } from '@ant-design/icons';
import { Button, Dropdown, Menu } from 'antd';
import { PageContainer } from '@ant-design/pro-layout';
import ProCard from '@ant-design/pro-card';
import 'antd/dist/antd.css';
import TreeTransfer from './TreeTransfer';
import data from './data.json';
import axios from 'axios';

const Test2 = () => {

  const [target, setTarget] = useState([]);
  const [source, setSource] = useState();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);

  const insertUser = (org, users, depart_code) => {
    const _users = users.filter(e => e.DEPART_CODE === depart_code)
    _users.map(user => (
      org.children.push({key: user._id, title:user.name+" "+(user.JOB_TITLE? user.JOB_TITLE: "")})
    ))
  }

  const fetch = async (params = {}) => {
    setLoading(true);

    var users = []
    const res1 = await axios.post('/api/users/list', {OFFICE_CODE: "7831"})
    if (res1.data.success) {
      users = res1.data.users
      setUsers(res1.data.users)
    }
    // console.log("users:"+users)

    const res = await axios.post('/api/users/orgList', params)
    if (res.data.success) {
      const orgs = res.data.orgs;
      const tree = []

      const level1 = orgs.filter(e => e.PARENT_NODE_ID === "")
      level1.forEach(function(org){
        const level2 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE)
        const org1 = {key: org.DEPART_CODE, title:org.DEPART_NAME, children:[], disableCheckbox: false, selectable: true}
        // const org1 = {key: org.DEPART_CODE, title:org.DEPART_NAME, children:[], disableCheckbox: true, selectable: false}
        insertUser(org1, users, org.DEPART_CODE)

        level2.forEach(function(org){
          const org2 = {key: org.DEPART_CODE, title:org.DEPART_NAME, children:[], disableCheckbox: false, selectable: true}
          insertUser(org2, users, org.DEPART_CODE)

          const level3 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE)
          level3.forEach(function(org){
            const org3 = {key: org.DEPART_CODE, title:org.DEPART_NAME, children:[], disableCheckbox: false, selectable: true}
            insertUser(org3, users, org.DEPART_CODE)

            const level4 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE)
            level4.forEach(function(org){
              const org4 = {key: org.DEPART_CODE, title:org.DEPART_NAME, children:[], disableCheckbox: false, selectable: true}
              insertUser(org4, users, org.DEPART_CODE)
              
              const level5 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE)
              level5.forEach(function(org){
                const org5 = {key: org.DEPART_CODE, title:org.DEPART_NAME, children:[], disableCheckbox: false, selectable: true}
                insertUser(org5, users, org.DEPART_CODE)
                org4.children.push(org5)
              })

              // insertUser(org4, users, org.DEPART_CODE)
              org3.children.push(org4)
              
            })

            // insertUser(org3, users, org.DEPART_CODE)
            org2.children.push(org3)
          })
          
          // insertUser(org2, users, org.DEPART_CODE)
          org1.children.push(org2)
        })
        // insertUser(org1, users, org.DEPART_CODE)
        tree.push(org1)
      })
      
      setSource(tree)

      // setData(tree)
      setLoading(false);

    } else {
        setLoading(false);
        alert(res.data.error)
    }
  };

  useEffect(() => {

    fetch({
        OFFICE_CODE: "7831"
      });

  }, []);



  const onChange = (target) => {
    setTarget(target)
  }

  const treeTransferProps = {
    source,
    target,
    rowKey: "key",
    rowTitle: "title",
    onChange: onChange
  };

  return (
    <div
        style={{
        background: '#FFF',
        }}
    >
        <TreeTransfer {...treeTransferProps} showSearch />
    </div>
  );
};

export default Test2;