import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';
import { Table, Input, Space, Button, Form, Radio } from "antd";
import Highlighter from 'react-highlight-words';
import { SearchOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../app/infoSlice';
import { navigate } from '@reach/router';
import { setDocToView } from '../ViewDocument/ViewDocumentSlice';
import { setDocToSign } from '../SignDocument/SignDocumentSlice';
import Moment from 'react-moment';
import moment from 'moment';
import 'moment/locale/ko';
import { useIntl } from "react-intl";
import ProForm, { ProFormText } from '@ant-design/pro-form';
// import { DocumentType, DocumentTypeText, DOCUMENT_SIGNED, DOCUMENT_TOSIGN, DOCUMENT_SIGNING, DOCUMENT_CANCELED } from './DocumentType';
import TemplateExpander from "./TemplateExpander";
import {
  FileOutlined
} from '@ant-design/icons';
import { selectTemplate, setTemplateTitle, selectTemplateTitle } from '../Assign/AssignSlice';

const SelectTemplate = forwardRef((props, ref) => {

  useImperativeHandle(ref, () => ({
    initTemplateUI() {
      console.log("initTemplateUI called!")
      setSelectedRowKeys([])
      form.setFieldsValue({
        documentTitle: "",
      })
    }
  }));

  // useImperativeHandle(ref, () => ({

  //   // setTitle() {
  //   // }
  //   resetSelect() {
  //     console.log("부모컴포넌트로부터 initSelect called!")
  //     setSelectedRowKeys([])
  //   }

  // }));

  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const user = useSelector(selectUser);
  
  const [form] = Form.useForm();
  const { _id } = user;
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [data, setData] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [hasSelected, setHasSelected] = useState(selectedRowKeys.length > 0);
  
  const [pagination, setPagination] = useState({current:1, pageSize:10});
  const [loading, setLoading] = useState(false);
  // const [expandable, setExpandable] = useState();
  const [visiblePopconfirm, setVisiblePopconfirm] = useState(false);

  const searchInput = useRef<Input>(null)

  const templateTitle = useSelector(selectTemplateTitle);
  const template = useSelector(selectTemplate);

  const handleTableChange = (pagination, filters, sorter) => {
    console.log("handleTableChange called")
    console.log(filters)
    fetch({
      sortField: sorter.field,
      sortOrder: sorter.order,
      pagination,
      ...filters,
      uid: _id,
      type: props.type
    });
  };

  const onFinish = (values) => {
    console.log('onFinish : ' + values);
    dispatch(setTemplateTitle(values.documentTitle));
    navigate('/assign')
  }

  const fetch = (params = {}) => {
    setLoading(true);

    axios.post('/api/template/templates', params).then(response => {

      console.log(response)
      if (response.data.success) {
        const templates = response.data.templates;

        setPagination({...params.pagination, total:response.data.total});
        setData(templates);
        setLoading(false);

        // 이전 화면에서 돌아왔을때 입력했던 값이 있는 경우 데이터 셋팅
        if(templateTitle) {
          console.log("templateTitle:"+templateTitle)
          form.setFieldsValue({
            documentTitle: templateTitle,
          })
        }
        if(template) {
          setSelectedRowKeys([template._id])
        }

      } else {
          setLoading(false);
          alert(response.data.error)
      }

    });
  };

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
            Search
          </Button>
          <Button onClick={() => handleReset(clearFilters)} size="small" style={{ width: 90 }}>
            Reset
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({ closeDropdown: false });
              setSearchText(selectedKeys[0])
              setSearchedColumn(dataIndex)
            }}
          >
            Filter
          </Button>
        </Space>
      </div>
    ),
    filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    // DB 필터링 사용 시는 주석처리
    // onFilter: (value, record) =>
    //   record[dataIndex]
    //     ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
    //     : '',
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

  const initTable = () => {
    console.log('init table called')
  }
  
  const columns = [
    {
      title: '템플릿 이름',
      dataIndex: 'docTitle',
      sorter: true,
      key: 'docTitle',
      ...getColumnSearchProps('docTitle'),
      expandable: true,
      render: (text,row) => <div><FileOutlined /> {text}</div>, // 여러 필드 동시 표시에 사용
    },
    {
      title: '생성자',
      width: '110px',
      dataIndex: ['user', 'name'],
      sorter: (a, b) => a.user.name.localeCompare(b.user.name),
      key: 'name',
      ...getColumnSearchProps('name'),
      onFilter: (value, record) =>
      record['user']['name']
        ? record['user']['name'].toString().toLowerCase().includes(value.toLowerCase())
        : ''
    },
    {
      title: '생성 일시',
      dataIndex: 'requestedTime',
      sorter: true,
      key: 'requestedTime',
      width: '110px',
      render: (text, row) => {
        return (<font color='#787878'>{moment(row["requestedTime"]).fromNow()}</font>)
      } 
    },
  ];


  const rowSelection = {
    selectedRowKeys,
    type : "radio",
    onChange : (selectedRowKeys, selectedRows) => {
      console.log('selectedRowKeys changed: ', selectedRowKeys);
      setSelectedRowKeys(selectedRowKeys)
      setHasSelected(selectedRowKeys.length > 0)

      // console.log(selectedRows);
      form.setFieldsValue({
        documentTitle: selectedRows[0].docTitle,
      })

      props.templateChanged(selectedRows[0])

    },
    // selections: [
    //   Table.SELECTION_ALL,
    //   Table.SELECTION_INVERT,
    //   Table.SELECTION_NONE,
    // ],
  };

  useEffect(() => {
    fetch({
      uid: _id,
      pagination,
      type: props.type
    });
  }, [_id]);

  return (
    <div>
      
      <ProForm 
        form={form}
        onFinish={onFinish}
        submitter={{
          // Configure the properties of the button
          resetButtonProps: {
            style: {
              // Hide the reset button
              display: 'none',
            },
          },
          submitButtonProps: {
            style: {
              // Hide the reset button
              display: 'none',
            },
          }
        }}
        onValuesChange={(changeValues) => {
          console.log("onValuesChange called")
          console.log(changeValues)
          console.log(form.getFieldValue("documentTitle"))
          if (form.getFieldValue("documentTitle").length > 0) {
            // setDisableNext(false)
            props.templateTitleChanged(form.getFieldValue("documentTitle"))
          } else {
            // setDisableNext(true)
          }
        }}
      >
        <ProFormText
          name="documentTitle"
          label="문서명"
          // width="md"
          tooltip="입력하신 문서명으로 상대방에게 표시됩니다."
          placeholder="문서명을 입력하세요."
          rules={[{ required: true, message: formatMessage({id: 'input.documentTitle'}) }]}
        />
      </ProForm>
      
      <Table
        rowKey={ item => { return item._id } }
        columns={columns}
        dataSource={data}
        pagination={pagination}
        loading={loading}
        // expandedRowRender={row => <TemplateExpander item={row} />}
        // expandRowByClick
        rowSelection={rowSelection}
        onRow={record => ({
          onClick: e => {
            // console.log(`user clicked on row ${record.t1}!`);
          }
        })}
        onChange={handleTableChange}
      />
    </div>
    
  );
});

export default SelectTemplate;
