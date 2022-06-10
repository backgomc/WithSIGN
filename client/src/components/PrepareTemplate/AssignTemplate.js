import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { navigate } from '@reach/router';
import axios from 'axios';
import { Button, Card, Avatar, message, Row, Col } from 'antd';
import ProCard from '@ant-design/pro-card';
import { PageContainer } from '@ant-design/pro-layout';
import { ArrowLeftOutlined, ArrowRightOutlined, UserOutlined, PlusOutlined } from '@ant-design/icons';
import { selectUser, setUser } from '../../app/infoSlice';
import { addSignee, setSignees, resetSignee, selectSignees } from './AssignTemplateSlice';
import { selectTemplateType } from '../Assign/AssignSlice';
import StepWrite from '../PrepareTemplate/StepTemplate';
import TreeTransfer from '../TreeTransfer/TreeTransfer';

import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import styled from 'styled-components';

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

const AssignTemplate = () => {
  
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const assignees = useSelector(selectSignees);
  const user = useSelector(selectUser);
  const templateType = useSelector(selectTemplateType);
  const { _id } = user;
  const [disableNext, setDisableNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [target, setTarget] = useState([]);
  const [source, setSource] = useState([]);
  const [checkedKeys, setCheckedKeys] = useState([]);
  const [users, setUsers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [columns, setColumns] = useState(columnsDefault);
  const treeRef = useRef();
  const insertUser = (org, users, depart_code) => {
    const _users = users.filter(e => e.DEPART_CODE === depart_code);
    _users.map(user => (
      org.children.push({key: user._id, title:user.name+' '+(user.JOB_TITLE? user.JOB_TITLE: '')})
    ));
  }
  const dfs = (currentOrg, level, users, orgs) => {
    level.forEach(org => {
      const current = {key: org.DEPART_CODE, title:org.DEPART_NAME, children:[], disableCheckbox: false, selectable: true}
      insertUser(current, users, org.DEPART_CODE)

      currentOrg.children?.push(current)

      const subLevel = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE)
      if (subLevel && subLevel.length > 0) {
        dfs(current, subLevel, users, orgs)
      }
    })  
  }

  const fetch = async (params = {}) => {
    setLoading(true);

    var users = []
    const res1 = await axios.post('/api/users/list', {OFFICE_CODE: '7831'});
    if (res1.data.success) {
      users = res1.data.users;
      // if (templateType === 'C' && user.role) {
        users.push({_id: "requester", name:"서명 참여자", DEPART_CODE: ""})
      // }
      // setUsers(res1.data.users);
      setUsers(users)
    }
    
    const res = await axios.post('/api/users/orgList', params);
    if (res.data.success) {
      const orgs = res.data.orgs;
      const tree = []
      setOrgs(orgs);

      const level1 = orgs.filter(e => e.PARENT_NODE_ID === "")
      level1.forEach(org => {
        const org1 = {key: org.DEPART_CODE, title:org.DEPART_NAME, children:[], disableCheckbox: false, selectable: true}
        insertUser(org1, users, org.DEPART_CODE)

        const level2 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE)
        if (level2) {
          dfs(org1, level2, users, orgs)
        }
        
        tree.push(org1)
        // if (templateType === 'C' && user.role) {
          tree.push({key: 'requester', title:'서명 참여자'})
        // }
        
      })

      // 서명참여자 추가
      // tree.push({key: 'requester', title:'서명 참여자'})

      setSource(tree)
      setLoading(false);

    } else {
      setLoading(false);
      alert(res.data.error);
    }
  };

  const handlePrepare = () => {

    //TODO: requester 혼자있을때 반영
    if (assignees.length > 0) {

      /*********************** S. 순차 서명 관련 전처리  ******************/
      // 유효성 체크 
      var validation = true;
      Object.entries(columns).map(([columnId, column], index) => {
        if (index > 0) {
          console.log(columns[columnId-1].items.length);
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
        column.items.map((item, subIndex) => {
          const key = item.id;
          const name = item.name;
          const JOB_TITLE = item.JOB_TITLE;
          const DEPART_NAME = item.DEPART_NAME;
          const order = columnId;
          dispatch(addSignee({ key, name, JOB_TITLE, DEPART_NAME, order }));
        })
      });
      /*********************** E. 순차 서명 관련 전처리  ******************/
      
      navigate('/prepareTemplate');
    }
  }

const columnsDefault = {
  [0]: {
    name: '1 단계',
    items: []
  },
  [1]: {
    name: '2 단계',
    items: []
  },
  [2]: {
    name: '3 단계',
    items: []
  }
};

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
  <ProCard style={{ width:'100%', background: '#FFFFFF'}} bodyStyle={{ marginLeft:'-10px', marginTop:'-12px'}} title='순차 지정' tooltip='같은 단계에 복수인 경우 동시에 요청' extra={<Button icon={<PlusOutlined />} onClick={() => {
    var lastKey = Object.keys(columns)[Object.keys(columns).length - 1];
    var newKey = Number(lastKey) + 1;
    
    if (newKey > 9) {
      message.warning('최대 단계는 10개까지 가능합니다.');
      return;
    }

    setColumns({
      ...columns,
      [newKey]: {
        name: (newKey + 1) + ' 단계',
        items: []
      }
    });
  }}></Button>}>
    <DragDropContext onDragEnd={result => onDragEnd(result, columns, setColumns)}>
      {Object.entries(columns ? columns : []).map(([columnId, column], index) => {
        return (
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center'
            }}
            key={columnId}
          >
            <div style={{ margin: 7, width: '100%', paddingLeft: 7 }}>
              <GroupTitle>{column.name}</GroupTitle>
              <Droppable droppableId={columnId} key={columnId}>
                {(provided, snapshot) => {
                  return (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      style={{
                        background: snapshot.isDraggingOver ? 'lightgrey' : '#cfdce6',
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
                                        height: '67px',
                                        userSelect: 'none',
                                        padding: 0,
                                        margin: '0 0 5px 0',
                                        backgroundColor: snapshot.isDragging
                                          ? '#FFFFFF'
                                          : '#FFFFFF',
                                        color: 'white',
                                        ...provided.draggableProps.style
                                      }}
                                  >
                                    <Meta avatar={item.thumbnail ?  <Avatar src={item.thumbnail} /> : <Avatar size={35} icon={<UserOutlined />} />}
                                      title={(item.JOB_TITLE)?item.name+' '+item.JOB_TITLE:item.name} description={item.DEPART_NAME}/>
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
    console.log('useEffect called');
    
    fetch({
      OFFICE_CODE: '7831'
    });

    // 순차 서명 유저 셋팅
    var newColumns = {};

    if (assignees) {

      const assigneesExceptRequester = assignees.filter(el => el.key !== 'requester')
      if (assigneesExceptRequester) {
        // 참여자 설정되어 있을 경우 유저 상태 체크 필요 
        axios.post('/api/users/check', {assignees: assigneesExceptRequester}).then(response => {
          let assigneesCheck  = response.data.assignees;
          
          var targets = [];
          assigneesCheck.forEach(element => {
            targets.push(element.key);
          });
          
          if (assignees.some(el => el.key === 'requester')) {
            targets.push('requester'); 
            dispatch(setSignees([...assigneesCheck, {key:'requester',name:'서명 참여자',order:0}]));
          } else {
            dispatch(setSignees(assigneesCheck));
          }
          
          setTarget(targets);
          
          if (targets.length > 0) {// && !(assigneesCheck.length === 1 && assigneesCheck[0].key === _id)) { // 참여자에 본인만 있을 경우 제한
            setDisableNext(false);
          } else {
            setDisableNext(true);
          }

          for (let i=0; i<10; i++) {
            const assigneesFiltered = assigneesCheck.filter(e => e.order == i);
            var newItems = [];

            if (i==0 && assignees.filter(el => el.key === 'requester')?.length > 0) {
              const element = assignees.filter(el => el.key === 'requester')[0]
              const newItem = {id:element.key, name:element.name, JOB_TITLE:element.JOB_TITLE, DEPART_NAME:element.DEPART_NAME };
              newItems.push(newItem);
            }
            assigneesFiltered.map(element => {
              const newItem = {id:element.key, name:element.name, JOB_TITLE:element.JOB_TITLE, DEPART_NAME:element.DEPART_NAME };
              newItems.push(newItem);
            });
            if (newItems.length > 0 || assigneesCheck.filter(e => e.order > i).length > 0) {
              newColumns[i] = {name: (i + 1) + ' 단계', items:newItems}
            }
          }
          
          console.log('newColumns', newColumns);
          if (Object.keys(newColumns).length > 0) {
            setColumns(newColumns);
          } else {
            setColumns(columnsDefault);
          }
        });
      } else {  // requester만 있는 경우

        var targets = [];
        if (assignees.some(el => el.key === 'requester')) targets.push('requester')
        setTarget(targets);

        var newItems = [];
        const element = assignees.filter(el => el.key === 'requester')[0]
        const newItem = {id:element.key, name:element.name, JOB_TITLE:element.JOB_TITLE, DEPART_NAME:element.DEPART_NAME };
        newItems.push(newItem);
        newColumns[0] = {name: 1 + ' 단계', items:newItems}
      }

    } else {
      setColumns(columnsDefault);
    }
  }, []);

  const onChange = (result, direction) => {
    console.log(treeRef);
    if (result.length > 20) {
      message.error('서명참여자는 최대 20명까지 지정할 수 있습니다.');
      return;
    }
    
    console.log('targetKeys', result);
    console.log('direction', direction);

    // 추가된 항목, 삭제된 항목 찾기
    var addedUsers = []; 
    var deletedUsers = [];
    if (direction == 'right') { // 추가
      addedUsers = [...result.filter(key => target.indexOf(key) < 0)]
    } else if(direction == 'left') {
      deletedUsers = [...target.filter(key => result.indexOf(key) < 0)]
    }

    console.log('addedUsers', addedUsers);
    console.log('deletedUsers', deletedUsers);

    setTarget(result);
    dispatch(resetSignee());

    for (let i=0; i<result.length; i++) {
      const temp = users.find(element => element._id == result[i]);
      const key = temp._id;
      const name = temp.name;
      const JOB_TITLE = temp.JOB_TITLE;
      const DEPART_NAME = orgs.filter(org => org.DEPART_CODE == temp.DEPART_CODE)[0]?.DEPART_NAME;
      const order = 0;
      dispatch(addSignee({ key, name, JOB_TITLE, DEPART_NAME, order }));
    }

    if (result.length > 0 ) {// && !(result.length === 1 && result[0] === _id)) { // 참여자에 본인만 있을 경우 제한
      setDisableNext(false);
    } else {
      setDisableNext(true);
    }

    // S. 순차 서명 항목 셋팅 - 추가, 삭제
    if (direction == 'right') { // 추가
      var newItems = [...columns[0].items];
      addedUsers.map(key => {
        const temp = users.find(element => element._id == key);
        const id = temp._id;
        const name = temp.name;
        const JOB_TITLE = temp.JOB_TITLE;
        const DEPART_NAME = orgs.filter(org => org.DEPART_CODE == temp.DEPART_CODE)[0]?.DEPART_NAME;

        newItems.push({id, name, JOB_TITLE, DEPART_NAME});
      });
      
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
        const newItems = column.items.filter(user => deletedUsers.indexOf(user.id) < 0);
        console.log('left newItems', newItems);
        newColumns[columnId] = {name: column.name, items:newItems }
      });
      setColumns(newColumns);
    }
  }

  const treeTransferProps = {
    source,
    target,
    rowKey: 'key',
    rowTitle: 'title',
    onChange: onChange
    };

  return (
    <div>
      <PageContainer
        // ghost
        header={{
          title: '템플릿 참여자 설정',
          ghost: true,
          breadcrumb: {
            routes: [
            ],
          },
          extra: [
            <Button key='3' icon={<ArrowLeftOutlined />} onClick={() => {navigate('/templateList');}}></Button>,
            <Button key='2' icon={<ArrowRightOutlined />} type='primary' onClick={() => handlePrepare()} disabled={disableNext}>
              {formatMessage({id: 'Next'})}
            </Button>,
          ],
        }}
        content= { <ProCard style={{ background: '#ffffff'}} layout='center'><StepWrite current={1} /></ProCard> }
        footer={[
        ]}
      >
        <Row gutter={24}><Col xl={18} lg={24} md={24} sm={24} xs={24} style={{display: 'flex', paddingBottom: '20px'}}>
            <ProCard direction='column' ghost gutter={[0, 16]}>
              <ProCard style={{ background: '#FFFFFF'}}>
                <TreeTransfer 
                  {...treeTransferProps}
                  showSearch 
                  loading={loading}
                  ref={treeRef}
                />
                <br></br>
                ※ <b>서명 참여자</b>: 참여자가 불특정한 경우 사용 (대량발송, 신청서 양식)
              </ProCard>
            </ProCard>
          </Col>
          <Col xl={6} lg={24} md={24} sm={24} xs={24} style={{display: 'flex', paddingBottom: '20px'}}>
            {sortView}
          </Col>
        </Row>
      </PageContainer>
    </div>
  );
};

export default AssignTemplate;
