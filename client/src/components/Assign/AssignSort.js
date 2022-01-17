import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { useIntl } from "react-intl";
import { navigate, Link } from '@reach/router';
import { Transfer, Tree, Input, Button, Space, message } from 'antd';
import { selectUser } from '../../app/infoSlice';
import { addSignee, resetSignee, selectAssignees, selectSendType } from './AssignSlice';
import StepWrite from '../Step/StepWrite'
import TreeTransfer from '../TreeTransfer/TreeTransfer';
import { PageContainer } from '@ant-design/pro-layout';
import ProCard from '@ant-design/pro-card';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import { selectPathname, setPathname } from '../../config/MenuSlice';

import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { v4 as uuid } from 'uuid';

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
  const itemsFromBackend = assignees.map(user => {
    return { id: user.key, name: user.name, JOB_TITLE: user.JOB_TITLE };
  });
  
  // const itemsFromBackend = [
  //   { id: uuid(), content: "First task" },
  //   { id: uuid(), content: "Second task" },
  //   { id: uuid(), content: "Third task" },
  //   { id: uuid(), content: "Fourth task" },
  //   { id: uuid(), content: "Fifth task" }
  // ];
  
  const columnsFromBackend = {
    [0]: {
      name: "1단계",
      items: itemsFromBackend
    },
    [1]: {
      name: "2단계",
      items: []
    },
    [2]: {
      name: "3단계",
      items: []
    },
    [3]: {
      name: "4단계",
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

  const [columns, setColumns] = useState(columnsFromBackend);

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
    <div style={{ display: "flex", justifyContent: "center", height: "100%" }}>
      <DragDropContext
        onDragEnd={result => onDragEnd(result, columns, setColumns)}
      >
        {Object.entries(columns ? columns : []).map(([columnId, column], index) => {
          return (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
              }}
              key={columnId}
            >
              <h2>{column.name}</h2>
              <div style={{ margin: 8 }}>
                <Droppable droppableId={columnId} key={columnId}>
                  {(provided, snapshot) => {
                    return (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        style={{
                          background: snapshot.isDraggingOver
                            ? "lightblue"
                            : "lightgrey",
                          padding: 4,
                          width: 250,
                          minHeight: 500
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
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={{
                                      userSelect: "none",
                                      padding: 16,
                                      margin: "0 0 8px 0",
                                      minHeight: "50px",
                                      backgroundColor: snapshot.isDragging
                                        ? "#263B4A"
                                        : "#456C86",
                                      color: "white",
                                      ...provided.draggableProps.style
                                    }}
                                  >
                                    {item.name} {item.JOB_TITLE}
                                  </div>
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
    </div>
  </PageContainer>
  );
};

export default AssignSort;
