import React, { useEffect, useState } from 'react';
import { Row, Col, Descriptions, Transfer, Tree, Input, Form, Button, Avatar } from 'antd';
import 'antd/dist/antd.css';
import axios from 'axios';
// import Profile from '../Profile/Profile';
import { CheckCard } from '@ant-design/pro-card';


import BTN01 from '../../assets/images/btn_board01.png';
import BTN02 from '../../assets/images/btn_board02.png';
import BTN03 from '../../assets/images/btn_board03.png';
import BTN04 from '../../assets/images/btn_board04.png';
import BTN05 from '../../assets/images/btn_board05.png';

import BTN01_ON from '../../assets/images/btn_board01_On.png';
import BTN02_ON from '../../assets/images/btn_board02_On.png';
import BTN03_ON from '../../assets/images/btn_board03_On.png';
import BTN04_ON from '../../assets/images/btn_board04_On.png';
import BTN05_ON from '../../assets/images/btn_board05_On.png';

import styled from 'styled-components';
const MyStyle = styled.div`
  .ant-pro-checkcard-title {
    text-align: right;
    font-size: 14px;
    color: #666666;
    margin: 0px 0px 0px 0px;
  } 
  .ant-pro-checkcard-description {
    font-weight: bold;
    color: #111111;
    font-size: 22px;
    margin: -3px 0px 0px 0px;
  }
  .ant-pro-checkcard {
    // width: 207px;
    width: 100%;
    border: none;
    margin-right: 0.8em;
  }
  .ant-pro-checkcard-content {
    padding: 23px 20px 20px 20px;
  }
  .ant-avatar {
    // max-height: 100%;
    height: 60px;
    width: 60px;
    // vertical-align: middle;
  }
  .ant-pro-checkcard-detail {
    padding-left: 0.5em;
  }
    `;

const MyStyle_Total = styled.div` 
 display: inline;
.ant-pro-checkcard-checked {
  background-color: #efb63b;
  // border-color: #1890ff;
  border: none;
  .ant-pro-checkcard-title {
    color: white;
  }
  .ant-pro-checkcard-description {
    color: white;
  }
}
`;

const MyStyle_ToSign = styled.div` 
 display: inline;
.ant-pro-checkcard-checked {
  background-color: #54c6e8;
  // border-color: #1890ff;
  border: none;
  .ant-pro-checkcard-title {
    color: white;
  }
  .ant-pro-checkcard-description {
    color: white;
  }
}
`;

const MyStyle_Signing = styled.div` 
 display: inline;
.ant-pro-checkcard-checked {
  background-color: #9694ff;
  // border-color: #1890ff;
  border: none;
  .ant-pro-checkcard-title {
    color: white;
  }
  .ant-pro-checkcard-description {
    color: white;
  }
}
`;

const MyStyle_Canceled = styled.div` 
 display: inline;
.ant-pro-checkcard-checked {
  background-color: #fe7975;
  // border-color: #1890ff;
  border: none;
  .ant-pro-checkcard-title {
    color: white;
  }
  .ant-pro-checkcard-description {
    color: white;
  }
}
`;

const MyStyle_Signed = styled.div` 
 display: inline;
.ant-pro-checkcard-checked {
  background-color: #5ddab4;
  // border-color: #1890ff;
  border: none;
  .ant-pro-checkcard-title {
    color: white;
  }
  .ant-pro-checkcard-description {
    color: white;
  }
}
`;

const { Search } = Input;

// Customize Table Transfer
const isChecked = (selectedKeys, eventKey) => selectedKeys.indexOf(eventKey) !== -1;

const generateTree = (treeNodes = [], checkedKeys = []) =>
  treeNodes.map(({ children, ...props }) => ({
    ...props,
    disabled: checkedKeys.includes(props.key),
    children: generateTree(children, checkedKeys),
  }));

  
const TreeTransfer = ({ dataSource, targetKeys, onSearch, expandedKeys, autoExpandParent, onExpand, ...restProps }) => {
  const transferDataSource = [];
  function flatten(list = []) {
    list.forEach(item => {
      transferDataSource.push(item);
      flatten(item.children);
    });
  }
  flatten(dataSource);

  return (
    <Transfer
      {...restProps}
      targetKeys={targetKeys}
      dataSource={transferDataSource}
      className="tree-transfer"
      render={item => item.title}
      showSelectAll={false}
    >
      {({ direction, onItemSelect, selectedKeys }) => {
        if (direction === 'left') {
          const checkedKeys = [...selectedKeys, ...targetKeys];
          return (
            <div>
            <Search style={{ padding:8 }} placeholder="Search" onChange={onSearch}  />
            <Tree
              blockNode
              checkable
              // checkStrictly /* 하위 같이 선택안되게 하려면 넣기 */
              defaultExpandAll
              checkedKeys={checkedKeys}
              expandedKeys={expandedKeys}
              autoExpandParent={autoExpandParent}
              onExpand={onExpand}
              treeData={generateTree(dataSource, targetKeys)}
              onCheck={(_, { node: { key } }) => {
                onItemSelect(key, !isChecked(checkedKeys, key));
              }}
              onSelect={(_, { node: { key } }) => {
                onItemSelect(key, !isChecked(checkedKeys, key));
              }}
            />
            </div>
          );
        }
      }}
    </Transfer>
  );
};

// const treeData = [
//   { key: '0-0', title: '0-0' },
//   {
//     key: '0-1',
//     title: '0-1',
//     children: [
//       { key: '0-1-0', title: '0-1-0' },
//       { key: '0-1-1', title: '0-1-1' },
//     ],
//   },
//   { key: '0-2', title: '0-3' },
// ];

const Test = () => {

  const [targetKeys, setTargetKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  const [expandedKeys, setExpandedKeys] = useState([]);
  const [searchValue, setSearchValue] = useState();
  const [autoExpandParent, setAutoExpandParent] = useState(false);

  const [users, setUsers] = useState([]);

  const onChange = keys => {
    setTargetKeys(keys);
    console.log("onChange called")
  };

  // function updateTreeData(list, key, children) {
  //   return list.map((node) => {
  //     if (node.key === key) {
  //       return { ...node, children };
  //     }
  
  //     if (node.children) {
  //       return { ...node, children: updateTreeData(node.children, key, children) };
  //     }
  
  //     return node;
  //   });
  // }

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

  const onSearch = e => {
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


  const [imgTotal, setImgTotal] = useState(BTN01);
  const [imgToSign, setImgToSign] = useState(BTN02_ON);
  const [imgSigning, setImgSigning] = useState(BTN03);
  const [imgCanceled, setImgCanceled] = useState(BTN04);
  const [imgSigned, setImgSigned] = useState(BTN05);

  const [checkTotal, setCheckTotal] = useState(false);
  const [checkToSign, setCheckToSign] = useState(true);
  const [checkSigning, setCheckSigning] = useState(false);
  const [checkCanceled, setCheckCanceled] = useState(false);
  const [checkSigned, setCheckSigned] = useState(false);

  const [checkedValue, setCheckedValue] = useState('tosign');

  const checkChanged = (value) => {
    setCheckedValue(value)
    if (typeof value == 'undefined') {
      console.log('aa')
      setCheckToSign(true)
    }
    console.log(value)
    if (value == "tosign") {
      setImgToSign('https://gw.alipayobjects.com/zos/bmw-prod/6935b98e-96f6-464f-9d4f-215b917c6548.svg');
    } else {
      setImgToSign('https://gw.alipayobjects.com/zos/bmw-prod/2dd637c7-5f50-4d89-a819-33b3d6da73b6.svg');
    }
  }

  return (
    // <div style={{padding:0, marginTop:'-24px', marginLeft:'-24px', marginRight:'-24px'}}>

    
    <div>

    <MyStyle>
    <Row gutter={12}>

    <Col xl={4} lg={4} md={4} sm={0} xs={0}>

    <MyStyle_Total>
     <CheckCard
        title="전체"
        avatar={
          <Avatar
            src={imgTotal}
            size="large"
          />
        }
        description="10"
        value="total"
        checked={checkTotal}
        onChange={(checked)=> {
          setCheckTotal(true)
          setCheckToSign(false)
          setCheckSigning(false)
          setCheckCanceled(false)
          setCheckSigned(false)

          setImgTotal(BTN01_ON)
          setImgToSign(BTN02);
          setImgSigning(BTN03);
          setImgCanceled(BTN04);
          setImgSigned(BTN05);
        }}
      />
      </MyStyle_Total>    
    </Col>

    <Col xl={5} lg={5} md={5} sm={5} xs={12}>

    <MyStyle_ToSign>
      <CheckCard
        title="서명(수신) 필요"
        avatar={
          <Avatar
            src={imgToSign}
            size="large"
          />
        }
        description="3"
        value="tosign"
        checked={checkToSign}
        onChange={(checked)=> {
          setCheckTotal(false)
          setCheckToSign(true)
          setCheckSigning(false)
          setCheckCanceled(false)
          setCheckSigned(false)

          setImgTotal(BTN01)
          setImgToSign(BTN02_ON);
          setImgSigning(BTN03);
          setImgCanceled(BTN04);
          setImgSigned(BTN05);
        }}
      />
      </MyStyle_ToSign>

    </Col>
    <Col xl={5} lg={5} md={5} sm={5} xs={12}>
    <MyStyle_Signing>
      <CheckCard
        title="진행중"
        avatar={
          <Avatar
            src={imgSigning}
            size="large"
          />
        }
        description="5"
        value="signing"
        checked={checkSigning}
        onChange={(checked)=> {
          setCheckTotal(false)
          setCheckToSign(false)
          setCheckSigning(true)
          setCheckCanceled(false)
          setCheckSigned(false)

          setImgTotal(BTN01)
          setImgToSign(BTN02);
          setImgSigning(BTN03_ON);
          setImgCanceled(BTN04);
          setImgSigned(BTN05);
        }}
      />
      </MyStyle_Signing>

    </Col>
    <Col xl={5} lg={5} md={5} sm={5} xs={12}>
     <MyStyle_Canceled>
      <CheckCard
        title="취소"
        avatar={
          <Avatar
            src={imgCanceled}
            size="large"
          />
        }
        description="0"
        value="canceled"
        checked={checkCanceled}
        onChange={(checked)=> {
          setCheckTotal(false)
          setCheckToSign(false)
          setCheckSigning(false)
          setCheckCanceled(true)
          setCheckSigned(false)

          setImgTotal(BTN01)
          setImgToSign(BTN02);
          setImgSigning(BTN03);
          setImgCanceled(BTN04_ON);
          setImgSigned(BTN05);
        }}
      />
      </MyStyle_Canceled>

    </Col>

    <Col xl={5} lg={5} md={5} sm={5} xs={12}>

    <MyStyle_Signed>
      <CheckCard
        title="서명완료"
        avatar={
          <Avatar
            src={imgSigned}
            size="large"
          />
        }
        description="10"
        value="signed"
        checked={checkSigned}
        onChange={(checked)=> {
          setCheckTotal(false)
          setCheckToSign(false)
          setCheckSigning(false)
          setCheckCanceled(false)
          setCheckSigned(true)

          setImgTotal(BTN01)
          setImgToSign(BTN02);
          setImgSigning(BTN03);
          setImgCanceled(BTN04);
          setImgSigned(BTN05_ON);
        }}
      />
      </MyStyle_Signed>

    </Col>
    {/* <Col xl={24} lg={24} md={24} sm={24} xs={24}> */}


    {/* <CheckCard.Group style={{ width: '100%' }} onChange={(value)=> {checkChanged(value);}}> */}







    {/* </CheckCard.Group> */}
    
    {/* </Col> */}
    
    </Row>

      {/* <TreeTransfer 
          dataSource={data}
          targetKeys={targetKeys} 
          onChange={onChange} 
          onSearch={onSearch}
          expandedKeys={expandedKeys}
          autoExpandParent={autoExpandParent}
          onExpand={onExpand}
      /> */}

      {/* <Descriptions title="" bordered size="small">
        <Descriptions.Item label="서명 정보">
          aaa
        </Descriptions.Item>
        <Descriptions.Item label="서명 정보">
          aaa
        </Descriptions.Item>
      </Descriptions> */}

    </MyStyle>

    </div>
  );
};

export default Test;