import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { useIntl } from "react-intl";
import { navigate, Link } from '@reach/router';
import { Transfer, Tree, Input, Button, Card, Avatar, message, Row, Col, Tag } from 'antd';
import { selectUser } from '../../app/infoSlice';
import { addSignee, resetSignee, selectAssignees, selectSendType } from './AssignSlice';
import StepWrite from '../Step/StepWrite'
import TreeTransfer from '../TreeTransfer/TreeTransfer';
import { PageContainer } from '@ant-design/pro-layout';
import ProCard from '@ant-design/pro-card';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import { selectPathname, setPathname } from '../../config/MenuSlice';

import { ArrowLeftOutlined, ArrowRightOutlined, UserOutlined, PlusOutlined } from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

import styled from 'styled-components';
import { random } from 'lodash';
const CardStyle = styled.div`
  .ant-card-meta {
    margin: -12px 0px 0px -8px;
  }
  .ant-card-meta-description {
    margin: -10px 0px 0px 0px; //top bottom left right
  }
`;

const GroupTitle = styled.div`
  padding: 5px;
  border: none;
  background: #216da9;
  color: #fff;
  font-weight: bold;
  align:center;
`;

const { Meta } = Card;
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
  const [orgs, setOrgs] = useState([]);
  const pathname = useSelector(selectPathname);

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
      setOrgs(orgs);

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

                const level6 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE)
                level6.forEach(function(org){
                  const org6 = {key: org.DEPART_CODE, title:org.DEPART_NAME, children:[], disableCheckbox: false, selectable: true}
                  insertUser(org6, users, org.DEPART_CODE)
                 
                  const level7 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE)
                  level7.forEach(function(org){
                    const org7 = {key: org.DEPART_CODE, title:org.DEPART_NAME, children:[], disableCheckbox: false, selectable: true}
                    insertUser(org7, users, org.DEPART_CODE)

                    const level8 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE)
                    level8.forEach(function(org){
                      const org8 = {key: org.DEPART_CODE, title:org.DEPART_NAME, children:[], disableCheckbox: false, selectable: true}
                      insertUser(org8, users, org.DEPART_CODE)

                      const level9 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE)
                      level9.forEach(function(org){
                        const org9 = {key: org.DEPART_CODE, title:org.DEPART_NAME, children:[], disableCheckbox: false, selectable: true}
                        insertUser(org9, users, org.DEPART_CODE)

                        const level10 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE)
                        level10.forEach(function(org){
                          const org10 = {key: org.DEPART_CODE, title:org.DEPART_NAME, children:[], disableCheckbox: false, selectable: true}
                          insertUser(org10, users, org.DEPART_CODE)
                          org9.children.push(org10)
                        })

                        org8.children.push(org9)
                      })

                      org7.children.push(org8)
                    })

                    org6.children.push(org7)
                  })


                  org5.children.push(org6)
                })

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

      /*********************** S. 순차 서명 관련 전처리  ******************/
      // 유효성 체크 
      var validation = true;
      Object.entries(columns).map(([columnId, column], index) => {
        if (index > 0) {
          console.log(columns[columnId-1].items.length)
          if(columns[columnId].items.length != 0 && columns[columnId-1].items.length == 0) {
            validation = false;
            message.warning(columnId + '단계에 1명 이상 등록이 필요합니다.');
            return; 
          }
        }
      });
      if (!validation) return;

      // 데이터 갱신
      dispatch(resetSignee());
      Object.entries(columns).map(([columnId, column], index) => {
        console.log('columnId:', columnId)
        console.log('column:', column)
        console.log('index:', index)

        column.items.map((item, subIndex) => {
          const key = item.id
          const name = item.name
          const JOB_TITLE = item.JOB_TITLE
          const DEPART_NAME = item.DEPART_NAME
          const order = columnId

          dispatch(addSignee({ key, name, JOB_TITLE, DEPART_NAME, order }));
        })
      });
      /*********************** E. 순차 서명 관련 전처리  ******************/

      navigate(`/prepareDocument`);
      // 임시 
      // navigate(`/assignSort`);
    } else {
      // setShowToast(true);
      // setTimeout(() => setShowToast(false), 1000);
    }
  }

/*********************************************** S. 순차 서명 기능 **********************************************/
const itemsSort = assignees.map(user => {
  return { id: user.key, name: user.name, JOB_TITLE: user.JOB_TITLE, DEPART_NAME: user.DEPART_NAME };
});
  
const columnsDefault = {
  [0]: {
    name: "1 단계",
    items: []
  },
  [1]: {
    name: "2 단계",
    items: []
  },
  [2]: {
    name: "3 단계",
    items: []
  }
};

const [columns, setColumns] = useState(columnsDefault);

const onDragEnd = (result, columns, setColumns) => {
  if (!result.destination) return;
  const { source, destination } = result;

  if (source.droppableId !== destination.droppableId) {
    const sourceColumn = columns[source.droppableId];
    const destColumn = columns[destination.droppableId];
    const sourceItems = [...sourceColumn.items];
    const destItems = [...destColumn.items];
    const [removed] = sourceItems.splice(source.index, 1);
    destItems.splice(destination.index, 0, removed);
    setColumns({
      ...columns,
      [source.droppableId]: {
        ...sourceColumn,
        items: sourceItems
      },
      [destination.droppableId]: {
        ...destColumn,
        items: destItems
      }
    });

  } else {
    const column = columns[source.droppableId];
    const copiedItems = [...column.items];
    const [removed] = copiedItems.splice(source.index, 1);
    copiedItems.splice(destination.index, 0, removed);
    setColumns({
      ...columns,
      [source.droppableId]: {
        ...column,
        items: copiedItems
      }
    });
  }
};

const sortView = (
  <ProCard style={{ width:'100%', background: '#FFFFFF'}} bodyStyle={{ marginLeft:'-10px', marginTop:'-12px'}} title="순차 지정" tooltip="같은 단계에 여러 명인 경우 동시 요청됨" extra={<Button icon={<PlusOutlined />} onClick={() => {
    console.log('btn clicked');
    var lastKey = Object.keys(columns)[Object.keys(columns).length - 1];
    var newKey = Number(lastKey) + 1;
    console.log("last key = " + lastKey);

    if (newKey > 9) {
      message.warning('최대 단계는 10개까지 가능합니다.');
      return;
    }

    setColumns({
      ...columns,
      [newKey]: {
        name: (newKey + 1) + " 단계",
        items: []
      }
    });
  }}></Button>}>
    <DragDropContext
      onDragEnd={result => onDragEnd(result, columns, setColumns)}
    >
      {Object.entries(columns ? columns : []).map(([columnId, column], index) => {
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center"
            }}
            key={columnId}
          >
            <div style={{ margin: 8, width: '100%', paddingLeft: 7 }}>
              {/* <Tag color='blue'>{column.name}</Tag> */}
              <GroupTitle>{column.name}</GroupTitle>
              <Droppable droppableId={columnId} key={columnId}>
                {(provided, snapshot) => {
                  return (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      style={{
                        background: snapshot.isDraggingOver
                          ? "lightgrey"
                          : "#cfdce6",
                        padding: 4,
                        width: '100%',
                        minHeight: 77
                      }}
                    >
                      {column.items.map((item, index) => {
                        return (
                          <Draggable
                            key={item.id}
                            draggableId={item.id}
                            index={index}
                          >
                            {(provided, snapshot) => {
                              return (

                                <CardStyle>
                                <ProCard 
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{
                                    height: "67px",
                                    userSelect: "none",
                                    padding: 0,
                                    margin: "0 0 5px 0",
                                    backgroundColor: snapshot.isDragging
                                      ? "#FFFFFF"
                                      : "#FFFFFF",
                                    color: "white",
                                    ...provided.draggableProps.style
                                  }}
                                >
                                <Meta
                                  avatar={item.thumbnail ?  <Avatar src={item.thumbnail} /> : <Avatar size={35} icon={<UserOutlined />} />}
                                  title={item.name +' '+ item.JOB_TITLE}
                                  description={item.DEPART_NAME}
                                />
                              </ProCard>
                              </CardStyle>
                              );
                            }}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  );
                }}
              </Droppable>
              
            </div>
          </div>
        );
      })}
    </DragDropContext>
    </ProCard>
)
/*********************************************** E. 순차 서명 기능 **********************************************/

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(setPathname('/documentList'));
    
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


      // 순차 서명 유저 셋팅
      var newColumns = {};

      for(let i=0; i<10; i++){
        const assigneesFiltered = assignees.filter(e => e.order == i)
        var newItems = [];
        assigneesFiltered.map(element => {
          const newItem = {id:element.key, name:element.name, JOB_TITLE:element.JOB_TITLE, DEPART_NAME:element.DEPART_NAME };
          newItems.push(newItem)
        })
        if(newItems.length > 0) {
          newColumns[i] = {name: "# " + (i + 1), items:newItems}
        }
      }

      console.log('newColumns', newColumns)
      console.log(newColumns.length)
      if (assignees.length > 0) {
        setColumns(newColumns);
      } else {
        setColumns(columnsDefault);
      }
      //



    }

  }, []);


  const onChange = (result, direction) => {
    if (sendType != 'B') {
      if (result.length > 10) {
        message.error('서명참여자는 최대 10명까지 지정할 수 있습니다.');
        return
      }
    }

    console.log("targetKeys", result)
    console.log("direction", direction)

    // 추가된 항목, 삭제된 항목 찾기
    var addedUsers = []; 
    var deletedUsers = [];
    if (direction == 'right') { // 추가
      addedUsers = [...result.filter(key => target.indexOf(key) < 0)]
    } else if(direction == 'left') {
      deletedUsers = [...target.filter(key => result.indexOf(key) < 0)]
    }
    console.log('addedUsers', addedUsers)
    console.log('deletedUsers', deletedUsers)


    setTarget(result)
    dispatch(resetSignee());

    for(let i=0; i<result.length; i++){

      const temp = users.find(element => element._id == result[i])
      
      const key = temp._id
      const name = temp.name
      const JOB_TITLE = temp.JOB_TITLE

      dispatch(addSignee({ key, name, JOB_TITLE }));

    }

    if(result.length > 0) {
      setDisableNext(false)
    } else {
      setDisableNext(true)
    }


    // S. 순차 서명 항목 셋팅 - 추가, 삭제
    if (direction == 'right') { // 추가
      var newItems = [...columns[0].items];
      addedUsers.map(key => {
        const temp = users.find(element => element._id == key)
        const id = temp._id
        const name = temp.name
        const JOB_TITLE = temp.JOB_TITLE
        const DEPART_NAME = orgs.filter(org => org.DEPART_CODE == temp.DEPART_CODE)[0]?.DEPART_NAME

        newItems.push({id, name, JOB_TITLE, DEPART_NAME});
      })
      
      setColumns({
        ...columns,
        [0]: {
          ...columns[0],
          items: newItems
        }
      });

    } else if (direction == 'left') { // 삭제
      
      var newColumns = {};
      Object.entries(columns ? columns : []).map(([columnId, column], index) => {
        const newItems = column.items.filter(user => deletedUsers.indexOf(user.id) < 0)
        console.log('left newItems', newItems)

        newColumns[columnId] = {name: column.name, items:newItems }
      })

      setColumns(newColumns)
    }
    // E

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
        
        {(sendType == 'B') ? 
        <Row gutter={24}>
          <Col xl={24} lg={24} md={24} sm={24} xs={24} style={{display: 'flex', paddingBottom: '20px'}}>
            <ProCard direction="column" ghost gutter={[0, 16]}>
              <ProCard style={{ background: '#FFFFFF'}}>
                <TreeTransfer 
                  {...treeTransferProps}
                  showSearch 
                  loading={loading}
                />
              </ProCard>
            </ProCard>
          </Col>
        </Row>
        : 
        <Row gutter={24}><Col xl={18} lg={24} md={24} sm={24} xs={24} style={{display: 'flex', paddingBottom: '20px'}}>
            <ProCard direction="column" ghost gutter={[0, 16]}>
              <ProCard style={{ background: '#FFFFFF'}}>
                <TreeTransfer 
                  {...treeTransferProps}
                  showSearch 
                  loading={loading}
                />
              </ProCard>
            </ProCard>
          </Col>
          <Col xl={6} lg={24} md={24} sm={24} xs={24} style={{display: 'flex', paddingBottom: '20px'}}>
            {sortView}
          </Col>
        </Row>}

      </PageContainer>
      
    </div>

  );
};

export default Assign;
