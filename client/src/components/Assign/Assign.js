import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { useIntl } from "react-intl";
import { navigate, Link } from '@reach/router';
import { Transfer, Tree, Input, Button, Space, message } from 'antd';
import { selectUser } from '../../app/infoSlice';
import { addSignee, resetSignee, selectAssignees } from './AssignSlice';
import StepWrite from '../Step/StepWrite'
import TreeTransfer from './TreeTransfer';
import { PageContainer } from '@ant-design/pro-layout';
import ProCard from '@ant-design/pro-card';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';

const { Search } = Input;

const Assign = () => {

  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const user = useSelector(selectUser);
  const { _id } = user;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const assignees = useSelector(selectAssignees);
  const [targetKeys, setTargetKeys] = useState([]);
  const [disableNext, setDisableNext] = useState(true);


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

    if (targetKeys.length > 5) {
      message.error('서명참여자는 최대 5명까지 지정할 수 있습니다.');
      return
    }

    setTargetKeys(targetKeys)
    dispatch(resetSignee());

    console.log("targetKeys:"+targetKeys)
    for(let i=0; i<targetKeys.length; i++){

      const temp = users.find(element => element._id == targetKeys[i])
      
      const key = temp._id
      const name = temp.name

      dispatch(addSignee({ key, name }));
    }

    if(targetKeys.length > 0) {
      setDisableNext(false)
    } else {
      setDisableNext(true)
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

    console.log("useEffect AAA")
    fetch({
      OFFICE_CODE: "7831"
    });

    if (assignees) {
      var targets = []
      assignees.forEach(element => {
        targets.push(element.key)
      });
      setTargetKeys(targets)
    }
    
    if(targetKeys.length > 0) {
      setDisableNext(false)
    } else {
      setDisableNext(true)
    }

  }, []);

  return (
    <div>

      <PageContainer
        ghost
        header={{
          title: '',
          ghost: true,
          breadcrumb: {
            routes: [
              {
                path: '/',
                breadcrumbName: '서명 요청',
              },
              {
                path: '/',
                breadcrumbName: '서명참여자 설정',
              },
            ],
          },
          extra: [
          ],
        }}
        footer={[
          <Button key="3" onClick={() => {navigate(`/uploadDocument`);}}>이전</Button>,
          <Button key="2" type="primary" onClick={() => handlePrepare()} disabled={disableNext}>
            {formatMessage({id: 'Next'})}
          </Button>,
        ]}
      >
        <ProCard direction="column" ghost gutter={[0, 16]}>
          <ProCard style={{ background: '#FFFFFF'}} layout="center">
            <StepWrite current={1} />
          </ProCard>
          <ProCard style={{ background: '#FFFFFF'}}>
            <TreeTransfer 
              dataSource={data}
              targetKeys={targetKeys} 
              onChange={handleChange} 
              onSearch={handleSearch}
              expandedKeys={expandedKeys}
              autoExpandParent={autoExpandParent}
              onExpand={onExpand}
            />
          </ProCard>
        </ProCard>
      </PageContainer>
      
      {/* <StepWrite current={1} />
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
       */}
    </div>

  );
};

export default Assign;
