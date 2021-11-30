import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Table, Input, Space, Button, Descriptions, Form } from "antd";
import Highlighter from 'react-highlight-words';
import { SearchOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../app/infoSlice';
import { navigate } from '@reach/router';
import { setDocToView } from '../ViewDocument/ViewDocumentSlice';
import Moment from 'react-moment';
import moment from "moment";
import 'moment/locale/ko';
import { DocumentType, DocumentTypeText, DocumentTypeIcon, DOCUMENT_SIGNED, DOCUMENT_TOSIGN, DOCUMENT_SIGNING, DOCUMENT_CANCELED } from '../Lists/DocumentType';
import {
  FileOutlined
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-layout';
import { useIntl } from "react-intl";
import ProCard from '@ant-design/pro-card';
import ProForm, { ProFormUploadDragger, ProFormText, ProFormTextArea } from '@ant-design/pro-form';
import '@ant-design/pro-form/dist/form.css';
import 'antd/dist/antd.css';

const BoardDetail = ({location}) => {

  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const boardId = location.state.boardId;
  // const bulk = location.state.bulk
  const { _id } = user;
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [data, setData] = useState([]);
  const [board, setBoard] = useState({title: '', requestedTime: '', user: {name: '', JOB_TITLE:''}});
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [hasSelected, setHasSelected] = useState(selectedRowKeys.length > 0);
  
  const [pagination, setPagination] = useState({current:1, pageSize:10});
  const [loading, setLoading] = useState(false);
  // const [expandable, setExpandable] = useState();
  const [visiblePopconfirm, setVisiblePopconfirm] = useState(false);

  const { formatMessage } = useIntl();
  const searchInput = useRef<Input>(null)
  const [form] = Form.useForm();

  const handleTableChange = (pagination, filters, sorter) => {
    console.log("handleTableChange called")
    console.log(filters)
    // fetch({
    //   sortField: sorter.field,
    //   sortOrder: sorter.order,
    //   pagination,
    //   ...filters,
    //   user: _id
    // });
  };

  const fetch = (params = {}) => {
    setLoading(true);

    axios.post('/api/board/detail', params).then(response => {

      console.log(response)
      if (response.data.success) {
        const board = response.data.board;
        setBoard(board);
        setLoading(false);
      } else {
          setLoading(false);
          alert(response.data.error)
      }

    });
  };

  // const Editor = () => (
  //   <>
  //     <ProForm 
  //       form={form}
  //       onFinish={onFinish}
  //       submitter={{
  //         searchConfig: {
  //           submitText: '등록',
  //         },      
  //         // Configure the properties of the button
  //         resetButtonProps: {
  //           // style: {
  //           //   // Hide the reset button
  //           //   display: 'none',
  //           // },
  //         },
  //         submitButtonProps: {
  //           style: {
  //             // Hide the reset button
  //             // display: 'none',
  //           },
  //         }
  //       }}
  //       onValuesChange={(changeValues) => {
  //         console.log("onValuesChange called")
  //         console.log(changeValues)
  //         // console.log('form.getFieldValue("title"):'+form.getFieldValue("title"))

  //         if (form.getFieldValue("content")) {
  //           // setDisableNext(false)
  //           console.log("AA")
  //         } else {
  //           // setDisableNext(true)
  //           console.log("BB")
  //         }
  //       }}
  //     >

  //       <ProFormTextArea 
  //         // label="내용" 
  //         name="content"
  //         // width="lg"
  //         fieldProps={{showCount: true, allowClear: true, rows: '5'}}
  //         rules={[{ autoSize: true, required: true, message: formatMessage({id: 'input.boardContent'}) }]}
  //       />

  //     </ProForm>

  //   </>
  // );


  const getColumnSearchProps = dataIndex => ({

    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          // ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            검색
          </Button>
          <Button onClick={() => handleReset(clearFilters)} size="small" style={{ width: 90 }}>
            초기화
          </Button>
          {/* <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({ closeDropdown: false });
              setSearchText(selectedKeys[0])
              setSearchedColumn(dataIndex)
            }}
          >
            필터
          </Button> */}
        </Space>
      </div>
    ),
    filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    // DB 필터링 사용 시는 주석처리
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
        : '',
    onFilterDropdownVisibleChange: visible => {
      if (visible) {
        // setTimeout(() => searchInput.select(), 100);
        // setTimeout(
        //   () => searchInput && searchInput.current && searchInput.current.select()
        // )
      }
    },
    render: text =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[setSearchText(searchText)]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      ),
  });

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchedColumn(selectedKeys[0])
    setSearchedColumn(dataIndex)
  }

  const handleReset = clearFilters => {
    clearFilters();
    setSearchText('');
  }

  const filterUsers = (query) => {
    return board.users.filter((el) =>
      el._id.toString().toLowerCase().indexOf(query.toString().toLowerCase()) > -1
    );
  }

  useEffect(() => {

    fetch({
      boardId: boardId  
    });

  }, []);

  return (
    <div>
    <PageContainer
        // ghost
        loading={loading}
        header={{
          // title: board ? board.title : '',
          title: board.title,
          // ghost: false,
          extra: [           
          <Button onClick={() => window.history.back()}>
            {formatMessage({id: 'Back'})}
          </Button>
          ],
        }}
        content={
          <Descriptions column={2} style={{ marginBottom: -16 }}>
            <Descriptions.Item label="작성자">{board.user.name} {board.user.JOB_TITLE}</Descriptions.Item>
            <Descriptions.Item label="작성 일시"><Moment format='YYYY/MM/DD HH:mm'>{board.requestedTime}</Moment></Descriptions.Item>
          </Descriptions>
        }
        footer={[
        ]}
    >

      <ProCard direction="column" style={{ height: '100%' }}>
        <pre>
          <div
            style={{height:'100%', padding:'10px', fontSize:'calc(13px + .2vw)'}}
            dangerouslySetInnerHTML={{
              __html: board.content
            }} 
          
          />
        </pre>
      </ProCard>

      {/* <div style={{background: 'white', marginTop: '25px', padding: '20px'}}>
      {data.length > 0 && <CommentList />}
        <Comment
          avatar={<Avatar src="https://joeschmoe.io/api/v1/random" alt="Han Solo" />}
          content={
            <Editor
            />
          }
        />
      </div> */}
      
        {/* <div
          style={{
            height: '100vh',
          }}
        >
          {board.content}
        </div> */}
    </PageContainer>
    </div>
    
  );
};

export default BoardDetail;
