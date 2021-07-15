import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { navigate, Link } from '@reach/router';
import { Transfer, Tree, Input, Button, Space } from 'antd';
import { selectUser } from '../../app/infoSlice';
import { addSignee, resetSignee, selectAssignees } from './AssignSlice';
import StepWrite from '../Step/StepWrite'
import TreeTransfer from './TreeTransfer';
import 'antd/dist/antd.css';

const { Search } = Input;

const Assign = () => {

  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { _id } = user;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const assignees = useSelector(selectAssignees);
  const [targetKeys, setTargetKeys] = useState([]);


  const [users, setUsers] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [autoExpandParent, setAutoExpandParent] = useState(false);
  const [searchValue, setSearchValue] = useState();

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
        const org1 = {key: org.DEPART_CODE, title:org.DEPART_NAME, children:[], disableCheckbox: true, selectable: false}
        // const org1 = {key: org.DEPART_CODE, title:org.DEPART_NAME, children:[], disableCheckbox: true, selectable: false}
        insertUser(org1, users, org.DEPART_CODE)

        level2.forEach(function(org){
          const org2 = {key: org.DEPART_CODE, title:org.DEPART_NAME, children:[], disableCheckbox: true, selectable: false}
          insertUser(org2, users, org.DEPART_CODE)

          const level3 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE)
          level3.forEach(function(org){
            const org3 = {key: org.DEPART_CODE, title:org.DEPART_NAME, children:[], disableCheckbox: true, selectable: false}
            insertUser(org3, users, org.DEPART_CODE)

            const level4 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE)
            level4.forEach(function(org){
              const org4 = {key: org.DEPART_CODE, title:org.DEPART_NAME, children:[], disableCheckbox: true, selectable: false}
              insertUser(org4, users, org.DEPART_CODE)
              
              const level5 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE)
              level5.forEach(function(org){
                const org5 = {key: org.DEPART_CODE, title:org.DEPART_NAME, children:[], disableCheckbox: true, selectable: false}
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
      
      setData(tree)

      // setData(tree)
      setLoading(false);

    } else {
        setLoading(false);
        alert(res.data.error)
    }
  };

  const handleChange = targetKeys => {
    setTargetKeys(targetKeys)
    dispatch(resetSignee());

    console.log("targetKeys:"+targetKeys)
    for(let i=0; i<targetKeys.length; i++){

      const temp = users.find(element => element._id == targetKeys[i])
      
      const key = temp._id
      const name = temp.name

      dispatch(addSignee({ key, name }));
    }
  };

  const handlePrepare = () => {
    if (assignees.length > 0) {
      navigate(`/prepareDocument`);
    } else {
      // setShowToast(true);
      // setTimeout(() => setShowToast(false), 1000);
    }
  }

  const handleSearch = e => {
    const { value } = e.target;
    console.log("search:"+value)
    // console.log("users:"+users)

    var expandedKeys = users
      .map(item => {
        if (item.name === value) {  //속도때문에 이름 모두 입력했을때 필터링하는게 좋을듯
        // if (item.name.indexOf(value) > -1) { //한 단어로 검색
          console.log("FIND IT")
          return item.DEPART_CODE
        }
        return null;
      })
      .filter((item, i, self) => item && self.indexOf(item) === i);
      if(value === "") expandedKeys = null

      // console.log("expandedKeys:"+expandedKeys)
    setExpandedKeys(expandedKeys)
    setAutoExpandParent(true)
    setSearchValue(value)
  }

  const onExpand = expandedKeys => {
    setExpandedKeys(expandedKeys)
    setAutoExpandParent(false)
  }

  useEffect(() => {

    fetch({
      OFFICE_CODE: "7831"
    });

  }, []);

  return (
    <div style={{padding:8}}>
      
      <StepWrite current={1} />
      <br></br>
      <TreeTransfer 
          dataSource={data}
          targetKeys={targetKeys} 
          onChange={handleChange} 
          onSearch={handleSearch}
          expandedKeys={expandedKeys}
          autoExpandParent={autoExpandParent}
          onExpand={onExpand}
      />
      <br></br>
      <p align="right"><Button type="primary" onClick={() => handlePrepare()}>다음</Button></p>
      
    </div>

    // <div style={{ padding: 8 }}>
    //   <p style={{width: "550px"}}><StepWrite current={1} /></p>
    //   <Space direction="vertical" align="center" size="middle">
    //     {/* <StepWrite current={0} /> */}
    //     <Transfer
    //       dataSource={data}
    //       showSearch
    //       listStyle={{
    //         width: 250,
    //         height: 300,
    //       }}
    //       operations={['to right', 'to left']}
    //       targetKeys={targetKeys}
    //       onChange={handleChange}
    //       render={item => `${item.name} ${item.email}`}
    //     />
    //     <Space align="baseline"><Button type="primary" onClick={() => handlePrepare()}>다음</Button></Space>
        
    //   </Space>
    // </div>
  );
};

export default Assign;
