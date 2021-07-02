import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { navigate, Link } from '@reach/router';
import { Transfer, Button, Space } from 'antd';
import { selectUser } from '../../app/infoSlice';
import { addSignee, resetSignee, selectAssignees } from './AssignSlice';
import StepWrite from '../Step/StepWrite'

const Assign = () => {

  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { _id } = user;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const assignees = useSelector(selectAssignees);
  const [targetKeys, setTargetKeys] = useState([]);

  const fetch = (params = {}) => {
    setLoading(true);

    axios.post('/api/users/list', params).then(response => {

      console.log(response)
      if (response.data.success) {
        const users = response.data.users;

        var datas = [];
        for (let i=0; i<users.length; i++) {
          const temp = {
            key: users[i]._id,
            name: users[i].name,
            email: users[i].email
          }
          datas.push(temp);
        }

        setData(datas);
        // assignees 에 값이 있으면 키 추가
        if (assignees.length > 0) {
          assignees.map(user => (
            targetKeys.push(user.key)
          ))
        }
        setLoading(false);

      } else {
          setLoading(false);
          alert(response.data.error)
      }

    });
  };

  const handleChange = targetKeys => {
    setTargetKeys(targetKeys)
    dispatch(resetSignee());

    for(let i=0; i<targetKeys.length; i++){

      const temp = data.find(element => element.key == targetKeys[i])
      
      const key = temp.key
      const name = temp.name
      const email = temp.email

      dispatch(addSignee({ key, name, email }));
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

    fetch({
      uid: _id
    });

  }, [_id]);

  return (
    <div style={{ padding: 8 }}>
      <Space direction="vertical" align="center" size="middle">
        {/* <StepWrite current={0} /> */}
        <Transfer
          dataSource={data}
          showSearch
          listStyle={{
            width: 250,
            height: 300,
          }}
          operations={['to right', 'to left']}
          targetKeys={targetKeys}
          onChange={handleChange}
          render={item => `${item.name} ${item.email}`}
        />
        <Space align="baseline"><Button type="primary" onClick={() => handlePrepare()}>다음</Button></Space>
        
      </Space>
    </div>
  );
};

export default Assign;
