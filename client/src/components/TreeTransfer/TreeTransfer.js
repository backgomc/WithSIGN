import React, { Component, useRef } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Button from 'antd/lib/button';
import Checkbox from 'antd/lib/checkbox';
import Input from 'antd/lib/input';
// import Tree from 'antd/lib/tree';
import { Tree } from 'antd';
import Alert from 'antd/lib/alert';
import Spin from 'antd/lib/spin';
import uniq from 'lodash.uniq';
import difference from 'lodash.difference';
import { hasUnLoadNode, unique } from './utils';
import { RightOutlined, LeftOutlined } from '@ant-design/icons';
import { Empty } from 'antd';
import './style.css?v=16';
const TreeNode = Tree.TreeNode;
const Search = Input.Search;

class TreeTransfer extends Component {
  constructor(props) {
    super(props);
    this.treeRef = React.createRef();
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
                <span style={{ color: 'black', background: 'yellow' }}>{treeSearchKey}</span>
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
        //S. 조직명 검색 되도록 처리
        let nodeTitle = title;
        // console.log('nodeTitle', nodeTitle);

        if (showSearch && treeSearchKey && treeSearchKey.length > 0) { // if tree searching
          if (title.indexOf(treeSearchKey) > -1) {
            expandedKeys.push(key);
            const idx = title.indexOf(treeSearchKey);
            nodeTitle = (
              <span>
                {title.substr(0, idx)}
                <span style={{ color: 'black', background: 'yellow' }}>{treeSearchKey}</span>
                {title.substr(idx + treeSearchKey.length)}
              </span>
            );
          }
        }
        // E

        return (
          <TreeNode key={key} title={nodeTitle} {...otherProps}>
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
    console.log('treeOnCheck called')
    if (e.checked) {
      console.log('e.checked called')
      if (this.props.onLoadData && hasUnLoadNode([e.node])) {
        this.setState({
          unLoadAlert: true
        });
      } else {
        console.log('leafkeys', this.state.leafKeys)
        this.setState({
          // treeCheckedKeys: checkedKeys.filter(key => this.state.leafKeys.indexOf(key) > -1),
          treeCheckedKeys: checkedKeys,
          treeCheckedKeysLeaf: checkedKeys.filter(key => this.state.leafKeys.indexOf(key) > -1),
          unLoadAlert: false
        });
      }
    } else {   
      console.log('e.checked else called')
      this.setState({
        // treeCheckedKeys: checkedKeys.filter(key => this.state.leafKeys.indexOf(key) > -1),
        treeCheckedKeys: checkedKeys,
        treeCheckedKeysLeaf: checkedKeys.filter(key => this.state.leafKeys.indexOf(key) > -1),
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
        
    console.log('onTreeSearch called')

    this.setState({
      treeSearchKey: value
    }, () => {

      console.log('SEARCH CALLED', this.state.treeSearchKey);

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
        }, () => {
          console.log('TREE DRAW FINISH !')
          console.log('expandedKeys', expandedKeys)

          // 검색 항목으로 스크롤 이동
          if (expandedKeys?.length > 0) {
            setTimeout(() => {
              console.log('setTimeout called');
              this.treeRef.current.scrollTo({ key: expandedKeys[0], align: "top" });
            }, 1000);
          }

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

  componentDidUpdate(prevProps, prevState) {
    // console.log('prevProps', prevProps);
    // console.log('prevState', prevState);
    // console.log('this.state.treeSearchKey', this.state.treeSearchKey);
    // console.log('prevState.treeSearchKey:', prevState.treeSearchKey);

    // //TODO: 검색한 항목의 위치로 scroll 이동
    // if (prevState.treeSearchKey !== this.state.treeSearchKey) {
    //   setTimeout(() => {
    //     console.log('setTimeout called');
    //     // this.treeRef.current.scrollTo({ key: '22220', align: "top" });
    //     let searchKey = this.props.source.filter(el => el.title === this.state.treeSearchKey)[0]?.key;
    //     console.log('props', this.props)
    //     console.log('rowKey', this.props.rowKey)
    //     console.log('rowTitle', this.props.rowTitle)
        

    //     this.treeRef.current.scrollTo({ key: searchKey, align: "top" });
    //   }, 1000);
    // }

  }

  render() {
    const { className, treeLoading, sourceTitle, targetTitle, showSearch, onLoadData } = this.props;
    const { treeNode, listData, leafKeys, treeCheckedKeys, treeCheckedKeysLeaf, listCheckedKeys, treeExpandedKeys, treeAutoExpandParent, listSearchKey, unLoadAlert } = this.state;

    const treeTransferClass = classNames({
      'lucio-tree-transfer': true,
      [className]: !!className
    });

    const treeTransferPanelBodyClass = classNames({
      'tree-transfer-panel-body': true,
      'tree-transfer-panel-body-has-search': showSearch,
    });

    const treeTransferPanelBodyRightClass = classNames({
      'tree-transfer-panel-body-right': true,
      'tree-transfer-panel-body-has-search': showSearch,
    });

    const treeProps = {
      checkable: true,
      checkedKeys: treeCheckedKeys, // 이게 원인 ... 체크한거 취소할때 필요함
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
      disabled: difference(treeCheckedKeysLeaf, listData.map(({key}) => key)).length === 0 && difference(listData.map(({key}) => key), treeCheckedKeysLeaf).length === 0,
      onClick: () => {
        this.setState({
          unLoadAlert: false
        });
        this.props.onChange && this.props.onChange(this.state.treeCheckedKeysLeaf, 'right');
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
        this.props.onChange && this.props.onChange(this.state.listData.map(({key}) => key).filter(key => this.state.listCheckedKeys.indexOf(key) < 0), 'left');
      }
    };

    return (
      <div className={treeTransferClass}>
        <div className="tree-transfer-panel tree-transfer-panel-left">
          <div className="tree-transfer-panel-header">
            <span className="tree-transfer-panel-header-select">{`${treeCheckedKeysLeaf?.length > 0 ? `${treeCheckedKeysLeaf?.length}/` : ''}${leafKeys.length}`} 명</span>
            <span className="tree-transfer-panel-header-title">{sourceTitle}</span>
          </div>
          <div className={treeTransferPanelBodyClass}>
            {showSearch ? <div className="tree-transfer-panel-body-search"><Search placeholder="이름 검색" onSearch={this.onTreeSearch} /></div> : null}
            <Spin spinning={treeLoading} size="small">
              {unLoadAlert ? <div className="tree-transfer-panel-body-alert"><Alert message="데이터 불러 오는 중..." banner /></div> : null}
              <div className="tree-transfer-panel-body-content">  
                <Tree {...treeProps} ref={this.treeRef} height={390}>
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
          <div className={treeTransferPanelBodyRightClass}>
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
  sourceTitle: ' 선택 전',
  targetTitle: ' 선택 됨',
  showSearch: false
};

export default TreeTransfer;