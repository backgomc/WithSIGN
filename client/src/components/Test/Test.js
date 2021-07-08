import React, { useEffect, useState } from 'react';
import { Descriptions, Transfer, Tree, Input } from 'antd';
import 'antd/dist/antd.css';
import axios from 'axios';
// import Profile from '../Profile/Profile';

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
    const res1 = await axios.post('/api/users/list', {COMPANY_CODE: "16"})
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
        const org1 = {key: org.DEPART_CODE, title:org.DEPART_NAME, children:[]}
        // const org1 = {key: org.DEPART_CODE, title:org.DEPART_NAME, children:[], disableCheckbox: true, selectable: false}
        insertUser(org1, users, org.DEPART_CODE)

        level2.forEach(function(org){
          const org2 = {key: org.DEPART_CODE, title:org.DEPART_NAME, children:[]}
          insertUser(org2, users, org.DEPART_CODE)

          const level3 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE)
          level3.forEach(function(org){
            const org3 = {key: org.DEPART_CODE, title:org.DEPART_NAME, children:[]}
            insertUser(org3, users, org.DEPART_CODE)

            const level4 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE)
            level4.forEach(function(org){
              const org4 = {key: org.DEPART_CODE, title:org.DEPART_NAME, children:[]}
              insertUser(org4, users, org.DEPART_CODE)
              
              const level5 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE)
              level5.forEach(function(org){
                const org5 = {key: org.DEPART_CODE, title:org.DEPART_NAME, children:[]}
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

  return (
    <div style={{padding:8}}>

      <TreeTransfer 
          dataSource={data}
          targetKeys={targetKeys} 
          onChange={onChange} 
          onSearch={onSearch}
          expandedKeys={expandedKeys}
          autoExpandParent={autoExpandParent}
          onExpand={onExpand}
      />

      {/* <Descriptions title="" bordered size="small">
        <Descriptions.Item label="서명 정보">
          aaa
        </Descriptions.Item>
        <Descriptions.Item label="서명 정보">
          aaa
        </Descriptions.Item>
      </Descriptions> */}
    </div>
  );
};

export default Test;