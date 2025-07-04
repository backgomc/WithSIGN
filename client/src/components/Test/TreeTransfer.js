import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Button from 'antd/lib/button';
import Checkbox from 'antd/lib/checkbox';
import Input from 'antd/lib/input';
import Tree from 'antd/lib/tree';
import Alert from 'antd/lib/alert';
import Spin from 'antd/lib/spin';
import uniq from 'lodash.uniq';
import difference from 'lodash.difference';
import { hasUnLoadNode, unique } from './utils';
import { RightOutlined, LeftOutlined } from '@ant-design/icons';
import { Empty } from 'antd';
import './style.css';
const TreeNode = Tree.TreeNode;
const Search = Input.Search;

class TreeTransfer extends Component {
  constructor(props) {
    super(props);
    const { treeNode, listData, leafKeys } = this.generate(props);
    const treeCheckedKeys = listData.map(({key}) => key);
    this.state = {
      treeNode,
      listData,
      leafKeys,
      treeCheckedKeys,
      treeExpandedKeys: treeCheckedKeys,
      treeAutoExpandParent: true, 
      listCheckedKeys: [],
      treeSearchKey: '',
      listSearchKey: '',
      unLoadAlert: false
    };
  }

  componentWillReceiveProps(nextProps) {
    const { treeNode, listData, leafKeys, expandedKeys } = this.generate(nextProps, this.state);
    const treeCheckedKeys = listData.map(({key}) => key);
    const { treeSearchKey, treeExpandedKeys } = this.state;
    const searching = !!(nextProps.showSearch && treeSearchKey && treeSearchKey.length > 0);
    this.setState({
      treeNode,
      listData,
      leafKeys,
      treeCheckedKeys,
      treeExpandedKeys: searching ? uniq([...treeCheckedKeys, ...expandedKeys]) : treeExpandedKeys,
      treeAutoExpandParent: searching, 
    });
  }

  generate = (props, state = {}) => {
    const { source, target, rowKey, rowTitle, rowChildren, showSearch } = props;
    const { treeSearchKey } = state;

    const leafKeys = [];  
    const listData = []; 
    const expandedKeys = []; 

    const loop = data => data.map(item => {
      const { [rowChildren]: children, [rowKey]: key, [rowTitle]: title, ...otherProps } = item;
      if (children === undefined) {
        leafKeys.push(key);
        let nodeTitle = title;
        if (showSearch && treeSearchKey && treeSearchKey.length > 0) { // if tree searching
          if (title.indexOf(treeSearchKey) > -1) {
            expandedKeys.push(key);
            const idx = title.indexOf(treeSearchKey);
            nodeTitle = (
              <span>
                {title.substr(0, idx)}
                <span style={{ color: '#f50' }}>{treeSearchKey}</span>
                {title.substr(idx + treeSearchKey.length)}
              </span>
            );
          }
        }
        if (target.indexOf(key) > -1) {
          listData.push({ key, title });
        }
        return <TreeNode key={key} title={nodeTitle} isLeaf {...otherProps} />;
      } else {
        return (
          <TreeNode key={key} title={title} {...otherProps}>
            {loop(children)}
          </TreeNode>
        );
      }
    });

    return {
      treeNode: loop(source),
      leafKeys,
      listData: unique(listData, 'key'),
      expandedKeys
    };
  }

  // tree checkbox checked
  treeOnCheck = (checkedKeys, e) => {
    if (e.checked) {
      if (this.props.onLoadData && hasUnLoadNode([e.node])) {
        this.setState({
          unLoadAlert: true
        });
      } else {
        this.setState({
          treeCheckedKeys: checkedKeys.filter(key => this.state.leafKeys.indexOf(key) > -1),
          unLoadAlert: false
        });
      }
    } else {
      this.setState({
        treeCheckedKeys: checkedKeys.filter(key => this.state.leafKeys.indexOf(key) > -1),
        unLoadAlert: false
      });
    }
  }

  // list checkbox checked
  listOnCheck = (e, checkedKeys) => {
    if (e.target.checked) {
      this.setState({
        listCheckedKeys: uniq([...this.state.listCheckedKeys, ...checkedKeys])
      });
    } else {
      this.setState({
        listCheckedKeys: this.state.listCheckedKeys.filter(key => checkedKeys.indexOf(key) < 0)
      });
    }
  }

  // left tree search 
  onTreeSearch = (value) => {
    this.setState({
      treeSearchKey: value
    }, () => {
      if (this.props.onLoadData && this.props.onTreeSearch) { // async search
        this.props.onTreeSearch(value);
      } else {
        const { treeNode, listData, leafKeys, expandedKeys } = this.generate(this.props, this.state);
        const treeCheckedKeys = listData.map(({key}) => key);
        this.setState({
          treeNode,
          listData,
          leafKeys,
          treeCheckedKeys,
          treeExpandedKeys: uniq([...treeCheckedKeys, ...expandedKeys]),
          treeAutoExpandParent: true, 
        });
      }
    });
  }

  // right list search 
  onListSearch = (value) => {
    this.setState({
      listSearchKey: value
    });
  }

  render() {
    const { className, treeLoading, sourceTitle, targetTitle, showSearch, onLoadData } = this.props;
    const { treeNode, listData, leafKeys, treeCheckedKeys, listCheckedKeys, treeExpandedKeys, treeAutoExpandParent, listSearchKey, unLoadAlert } = this.state;

    const treeTransferClass = classNames({
      'lucio-tree-transfer': true,
      [className]: !!className
    });

    const treeTransferPanelBodyClass = classNames({
      'tree-transfer-panel-body': true,
      'tree-transfer-panel-body-has-search': showSearch,
    });

    const treeProps = {
      checkable: true,
      checkedKeys: treeCheckedKeys,
      onCheck: this.treeOnCheck,
      expandedKeys: treeExpandedKeys,
      autoExpandParent: treeAutoExpandParent,
      onExpand: (expandedKeys) => {
        this.setState({
          treeAutoExpandParent: false,
          treeExpandedKeys: expandedKeys,
        });
      },
      loadData: onLoadData
    };

    const listHeaderCheckProps = {
      checked: listCheckedKeys.length > 0 && listCheckedKeys.length === listData.length,
      indeterminate: listCheckedKeys.length > 0 && listCheckedKeys.length < listData.length,
      onChange: (e) => this.listOnCheck(e, listData.map(({key}) => key))
    };

    const operaRightButtonProps = {
      type: 'primary',
      icon: <RightOutlined />,
      size: 'small',
      disabled: difference(treeCheckedKeys, listData.map(({key}) => key)).length === 0 && difference(listData.map(({key}) => key), treeCheckedKeys).length === 0,
      onClick: () => {
        this.setState({
          unLoadAlert: false
        });
        this.props.onChange && this.props.onChange(this.state.treeCheckedKeys);
      }
    };

    const operaLeftButtonProps = {
      type: 'primary',
      icon: <LeftOutlined />,
      size: 'small',
      disabled: listCheckedKeys.length === 0,
      onClick: () => {
        this.setState({
          listCheckedKeys: [],
          unLoadAlert: false
        });
        this.props.onChange && this.props.onChange(this.state.listData.map(({key}) => key).filter(key => this.state.listCheckedKeys.indexOf(key) < 0));
      }
    };

    return (
      <div className={treeTransferClass}>
        <div className="tree-transfer-panel tree-transfer-panel-left">
          <div className="tree-transfer-panel-header">
            <span className="tree-transfer-panel-header-select">{`${treeCheckedKeys.length > 0 ? `${treeCheckedKeys.length}/` : ''}${leafKeys.length}`} 명</span>
            <span className="tree-transfer-panel-header-title">{sourceTitle}</span>
          </div>
          <div className={treeTransferPanelBodyClass}>
            {showSearch ? <div className="tree-transfer-panel-body-search"><Search placeholder="이름 검색" onSearch={this.onTreeSearch} /></div> : null}
            <Spin spinning={treeLoading} size="small">
              {unLoadAlert ? <div className="tree-transfer-panel-body-alert"><Alert message="데이터 불러 오는 중..." banner /></div> : null}
              <div className="tree-transfer-panel-body-content">  
                <Tree {...treeProps}>
                  {treeNode}
                </Tree>
              </div>
            </Spin>
          </div>
        </div>
        <div className="tree-transfer-operation">
          <Button {...operaRightButtonProps} />
          <Button {...operaLeftButtonProps} />
        </div>
        <div className="tree-transfer-panel tree-transfer-panel-right">
          <div className="tree-transfer-panel-header">
            <Checkbox {...listHeaderCheckProps} /> &nbsp;
            <span className="tree-transfer-panel-header-select">{`${listCheckedKeys.length > 0 ? `${listCheckedKeys.length}/` : ''}${listData.length}`} 명</span>
            <span className="tree-transfer-panel-header-title">{targetTitle}</span>
          </div>
          <div className={treeTransferPanelBodyClass}>
            {showSearch ? <div className="tree-transfer-panel-body-search"><Search placeholder="이름 검색" onSearch={this.onListSearch} /></div> : null}
            <ul className="tree-transfer-panel-body-content">
              {
                listData.length > 0 ?
                listData.map(item => (
                  <li key={item.key}>
                    <Checkbox checked={listCheckedKeys.indexOf(item.key) > -1} onChange={(e) => this.listOnCheck(e, [item.key])} /> &nbsp;
                    {
                      showSearch && listSearchKey && listSearchKey.length > 0 && item.title.indexOf(listSearchKey) > -1 ? (
                        <span>
                          {item.title.substr(0, item.title.indexOf(listSearchKey))}
                          <span style={{ color: '#f50' }}>{listSearchKey}</span>
                          {item.title.substr(item.title.indexOf(listSearchKey) + listSearchKey.length)}
                        </span>
                      ) : <span>{item.title}</span>
                    }
                  </li>
                )) : <div style={{marginTop:100}}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /></div>
              }
            </ul>
          </div>
        </div>
      </div>
    );
  }
}

TreeTransfer.propTypes = {
  className: PropTypes.string,
  rowKey: PropTypes.string,
  rowTitle: PropTypes.string,
  rowChildren: PropTypes.string,
  source: PropTypes.array,
  target: PropTypes.array,
  treeLoading: PropTypes.bool,
  sourceTitle: PropTypes.string,
  targetTitle: PropTypes.string,
  onChange: PropTypes.func,
  showSearch: PropTypes.bool,
  onLoadData: PropTypes.func,
  onTreeSearch: PropTypes.func,
};

TreeTransfer.defaultProps = {
  rowKey: 'key',
  rowTitle: 'title',
  rowChildren: 'children',
  source: [],
  target: [],
  treeLoading: false,
  sourceTitle: ' 선택전',
  targetTitle: ' 선택됨',
  showSearch: false
};

export default TreeTransfer;