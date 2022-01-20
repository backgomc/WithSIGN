import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { useIntl } from "react-intl";
import { navigate, Link } from '@reach/router';
import { Transfer, Tree, Input, Button, Card, Avatar, message } from 'antd';
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
import { v4 as uuid } from 'uuid';


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


const AssignSort = () => {

  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const user = useSelector(selectUser);
  const sendType = useSelector(selectSendType);
  const { _id } = user;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [disableNext, setDisableNext] = useState(false);
  const [target, setTarget] = useState([]);
  const [source, setSource] = useState([]);
  const [users, setUsers] = useState([]);
  const pathname = useSelector(selectPathname);


  const assignees = useSelector(selectAssignees);
  const itemsSort = assignees.map(user => {
    return { id: user.key, name: user.name, JOB_TITLE: user.JOB_TITLE };
  });
    
  const columnsSort = {
    [0]: {
      name: "순서 1",
      items: itemsSort
    },
    [1]: {
      name: "순서 2",
      items: []
    },
    [2]: {
      name: "순서 3",
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

  const handlePrepare = () => {

    console.log(columns);

    // 유효성 체크 
    var validation = true;
    Object.entries(columns).map(([columnId, column], index) => {
      if (index > 0) {
        console.log(columns[columnId-1].items.length)
        if(columns[columnId].items.length != 0 && columns[columnId-1].items.length == 0) {
          validation = false;
          message.warning('순서 ' + columnId + '에 1명 이상 등록이 필요합니다.');
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
        const order = columnId
  
        dispatch(addSignee({ key, name, JOB_TITLE, order }));
      })
    });

    navigate(`/prepareDocument`);

  }

  useEffect(() => {
  }, []);

  const [columns, setColumns] = useState(columnsSort);

  return (
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
        <Button key="3" icon={<ArrowLeftOutlined />} onClick={() => {navigate(`/assign`);}}></Button>,
        <Button key="2" icon={<ArrowRightOutlined />} type="primary" onClick={() => handlePrepare()} disabled={disableNext}>
          {formatMessage({id: 'Next'})}
        </Button>,
      ],
    }}
    content= { <ProCard style={{ background: '#ffffff'}} layout="center"><StepWrite current={1} /></ProCard> }
    footer={[
    ]}
  >
    {/* <div style={{ display: "flex", justifyContent: "center", height: "100%" }}> */}

    <ProCard style={{ width:'295px', background: '#FFFFFF'}} bodyStyle={{ marginLeft:'-10px', marginTop:'-12px'}} title="순서 지정" extra={<Button icon={<PlusOutlined />} onClick={() => {
      console.log('btn clicked');
      var lastKey = Object.keys(columns)[Object.keys(columns).length - 1];
      var newKey = Number(lastKey) + 1;
      console.log("last key = " + lastKey);

      if (newKey > 9) {
        message.warning('최대 순서는 10개까지 가능합니다.');
        return;
      }

      setColumns({
        ...columns,
        [newKey]: {
          name: "순서 " + (newKey + 1),
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
              <div style={{ margin: 8 }}>
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
                          width: 250,
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
                                    description="팀명"
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
      
    {/* </div> */}
  </PageContainer>
  );
};

export default AssignSort;
