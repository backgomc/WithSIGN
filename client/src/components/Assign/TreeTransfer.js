import React from 'react';
import { Transfer, Tree, Input } from 'antd';
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

export default TreeTransfer;
