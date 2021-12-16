import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { useIntl } from "react-intl";
import { navigate, Link } from '@reach/router';
import { Transfer, Tree, Input, Button, Space, message } from 'antd';
import { selectUser } from '../../app/infoSlice';
import { addSignee, resetSignee, selectAssignees, selectSendType } from './AssignSlice';
import StepWrite from '../Step/StepWrite'
import TreeTransfer from '../TreeTransfer/TreeTransfer';
import { PageContainer } from '@ant-design/pro-layout';
import ProCard from '@ant-design/pro-card';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';

import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';


const { Search } = Input;

const Assign = () => {

  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const user = useSelector(selectUser);
  const sendType = useSelector(selectSendType);
  const { _id } = user;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const assignees = useSelector(selectAssignees);
  const [disableNext, setDisableNext] = useState(true);
  const [target, setTarget] = useState([]);
  const [source, setSource] = useState([]);
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

  const handlePrepare = () => {
    if (assignees.length > 0) {
      navigate(`/prepareDocument`);
    } else {
      // setShowToast(true);
      // setTimeout(() => setShowToast(false), 1000);
    }
  }

  useEffect(() => {
    if (document.getElementsByClassName('ant-menu-item-selected') && document.getElementsByClassName('ant-menu-item-selected')[0] && document.getElementsByClassName('ant-menu-item-selected')[0].classList) {
      document.getElementsByClassName('ant-menu-item-selected')[0].classList.remove('ant-menu-item-selected');
    }
    console.log("useEffect called")
    fetch({
      OFFICE_CODE: "7831"
    });

    if (assignees) {
      var targets = []
      assignees.forEach(element => {
        targets.push(element.key)
      });
      setTarget(targets)

      if(assignees.length > 0) {
        setDisableNext(false)
      } else {
        setDisableNext(true)
      }
    }

  }, []);


  const onChange = (target) => {
    if (sendType != 'B') {
      if (target.length > 10) {
        message.error('서명참여자는 최대 10명까지 지정할 수 있습니다.');
        return
      }
    }

    console.log("targetKeys:"+target)

    setTarget(target)
    dispatch(resetSignee());

    for(let i=0; i<target.length; i++){

      const temp = users.find(element => element._id == target[i])
      
      const key = temp._id
      const name = temp.name
      const JOB_TITLE = temp.JOB_TITLE

      dispatch(addSignee({ key, name, JOB_TITLE }));
    }

    if(target.length > 0) {
      setDisableNext(false)
    } else {
      setDisableNext(true)
    }
  }

  const treeTransferProps = {
    source,
    target,
    rowKey: "key",
    rowTitle: "title",
    onChange: onChange
  };

  return (
    <div>

      <PageContainer
        // ghost
        header={{
          title:(sendType == 'B') ? '서명 요청(대량 전송)' : '서명 요청',
          ghost: true,
          breadcrumb: {
            routes: [
            ],
          },
          extra: [
            <Button key="3" icon={<ArrowLeftOutlined />} onClick={() => {navigate(`/uploadDocument`);}}></Button>,
            <Button key="2" icon={<ArrowRightOutlined />} type="primary" onClick={() => handlePrepare()} disabled={disableNext}>
              {formatMessage({id: 'Next'})}
            </Button>,
          ],
        }}
        content= { <ProCard style={{ background: '#ffffff'}} layout="center"><StepWrite current={1} /></ProCard> }
        footer={[
        ]}
      >
        <ProCard direction="column" ghost gutter={[0, 16]}>
          <ProCard style={{ background: '#FFFFFF'}}>
            <TreeTransfer 
              {...treeTransferProps}
              showSearch 
              loading={loading}
            />
          </ProCard>
        </ProCard>
      </PageContainer>
      
    </div>

  );
};

export default Assign;
