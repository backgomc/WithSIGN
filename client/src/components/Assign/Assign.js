import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { useIntl } from "react-intl";
import { navigate, Link } from '@reach/router';
import { Transfer, Tree, Input, Button, Card, Avatar, message, Row, Col, Tag } from 'antd';
import { selectUser } from '../../app/infoSlice';
import { addSignee, setSignees, resetSignee, selectAssignees, selectSendType, selectDocumentType } from './AssignSlice';
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

const Assign = ({location}) => {

  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const user = useSelector(selectUser);
  const sendType = useSelector(selectSendType);
  const documentType = useSelector(selectDocumentType);
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

  const [documentFile, setDocumentFile] = useState(location?.state.documentFile ? location?.state.documentFile : []);
  const [attachFiles, setAttachFiles] = useState(location?.state.attachFiles ? location?.state.attachFiles : []);

  const insertUser = (org, users, depart_code) => {
    const _users = users.filter(e => e.DEPART_CODE === depart_code)
    _users.map(user => (
      org.children.push({key: user._id, title:user.name+" "+(user.JOB_TITLE? user.JOB_TITLE: "")})
    ))
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
      level1.forEach(org => {
        const org1 = {key: org.DEPART_CODE, title:org.DEPART_NAME, children:[], disableCheckbox: false, selectable: true}
        insertUser(org1, users, org.DEPART_CODE)

        const level2 = orgs.filter(e => e.PARENT_NODE_ID === org.DEPART_CODE)
        if (level2) {
          dfs(org1, level2, users, orgs)
        }
        
        tree.push(org1)
      })

      setSource(tree)
      setLoading(false);

    } else {
        setLoading(false);
        alert(res.data.error)
    }
  };

  const handlePrepare = () => {
    if (assignees.length > 0) {

      if (sendType !== 'B') {
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
      }

      // navigate(`/prepareDocument`);

      navigate('/prepareDocument', { state: {attachFiles: attachFiles, documentFile: documentFile} })

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
  <ProCard style={{ width:'100%', background: '#FFFFFF'}} bodyStyle={{ marginLeft:'-10px', marginTop:'-12px'}} title="순차 지정" tooltip="같은 단계에 복수인 경우 동시에 요청" extra={<Button icon={<PlusOutlined />} onClick={() => {
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
                                  title={(item.JOB_TITLE)?item.name+' '+item.JOB_TITLE:item.name}
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

    // 순차 서명 유저 셋팅
    var newColumns = {};

    if (assignees) {
      // 참여자 설정되어 있을 경우 유저 상태 체크 필요 
      axios.post('/api/users/check', {assignees: assignees}).then(response => {
        let assigneesCheck  = response.data.assignees;

        //TODO: 1단계에 사람이 없는데 다음단계에 사람이 있는 경우 단계를 내려준다.
        // 0:
        // DEPART_NAME: "신기술연구팀"
        // JOB_TITLE: "차장"
        // key: "6156a3c9c7f00c0d4ace4744"
        // name: "박세현"
        // order: "1"
        // _id: "62a69aa9fd2670049e6ca2c8"
        if (assigneesCheck.length > 0 && assigneesCheck.filter(el => el.order === "0").length === 0) {
          assigneesCheck.forEach(el => {
            el.order = el.order - 1;
          })
        }

        dispatch(setSignees(assigneesCheck));

        var targets = []
        assignees.forEach(element => {
          targets.push(element.key);
        });
        setTarget(targets);

        if (assigneesCheck.length > 0) {// && !(assigneesCheck.length === 1 && assigneesCheck[0].key === _id)) { // 참여자에 본인만 있을 경우 제한
          setDisableNext(false);
        } else {
          setDisableNext(true);
        }

        for (let i=0; i<10; i++) {
          const assigneesFiltered = assigneesCheck.filter(e => e.order == i);
          var newItems = [];
          assigneesFiltered.map(element => {
            const newItem = {id:element.key, name:element.name, JOB_TITLE:element.JOB_TITLE, DEPART_NAME:element.DEPART_NAME };
            newItems.push(newItem);
          })
          if (newItems.length > 0 || assigneesCheck.filter(e => e.order > i).length > 0) {
            newColumns[i] = {name: (i + 1) + " 단계", items:newItems}
          }
        }

        console.log('newColumns', newColumns);
        if (Object.keys(newColumns).length > 0) {
          setColumns(newColumns);
        } else {
          setColumns(columnsDefault);
        }
      });
    } else {
      setColumns(columnsDefault);
    }
  }, []);


  const onChange = (result, direction) => {
    if (sendType != 'B') {
      if (result.length > 20) {
        message.error('서명참여자는 최대 20명까지 지정할 수 있습니다.');
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
      const DEPART_NAME = orgs.filter(org => org.DEPART_CODE == temp.DEPART_CODE)[0]?.DEPART_NAME
      const order = 0
      dispatch(addSignee({ key, name, JOB_TITLE, DEPART_NAME, order }));

    }

    if(result.length > 0) {//  && !(result.length === 1 && result[0] === _id)) { // 참여자에 본인만 있을 경우 제한
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
            <Button key="3" icon={<ArrowLeftOutlined />} onClick={() => {documentType === 'DIRECT' ? navigate(`/templateList`) : navigate(`/uploadDocument`, { state: {attachFiles: attachFiles, documentFile: documentFile} })}}></Button>,
            <Button key="2" icon={<ArrowRightOutlined />} type="primary" onClick={() => handlePrepare()} disabled={disableNext}>
              {formatMessage({id: 'Next'})}
            </Button>,
          ],
        }}
        content= { <ProCard style={{ background: '#ffffff'}} layout="center"><StepWrite current={1} documentFile={documentFile} attachFiles={attachFiles} /></ProCard> }
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
