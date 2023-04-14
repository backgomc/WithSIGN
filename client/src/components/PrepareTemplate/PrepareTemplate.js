import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { navigate } from '@reach/router';
import { Badge, Button, Row, Col, List, Card, Checkbox, Tooltip, Tag, Spin, Divider, Typography } from 'antd';
import Icon, { PlusOutlined, ArrowLeftOutlined, SendOutlined } from '@ant-design/icons';
import { selectSignees, selectObservers, selectTemplateId, selectTemplateRef, selectTemplateFileName, selectIsWithPDF, resetAssignAll } from './AssignTemplateSlice';
import { selectPathname, setPathname } from '../../config/MenuSlice';
import { selectTemplateTitle, setTemplateTitle } from '../Assign/AssignSlice';
import { selectUser } from '../../app/infoSlice';
import './PrepareTemplate.css';
import StepWrite from '../PrepareTemplate/StepTemplate';
import { useIntl } from 'react-intl';
import { PageContainer } from '@ant-design/pro-layout';
import ProCard from '@ant-design/pro-card';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import { ReactComponent as IconSign} from '../../assets/images/sign.svg';
import { ReactComponent as IconText} from '../../assets/images/text.svg';
import { ReactComponent as IconCheckbox} from '../../assets/images/checkbox.svg';

import PDFViewer from "@niceharu/withpdf";
import {TYPE_SIGN, TYPE_IMAGE, TYPE_TEXT, TYPE_BOX, TYPE_CHECKBOX, COLORS, AUTO_NAME, AUTO_JOBTITLE, AUTO_OFFICE, AUTO_DEPART, AUTO_SABUN, AUTO_DATE} from '../../common/Constants';

import styled from 'styled-components';
const PageContainerStyle = styled.div`
.ant-pro-page-container-children-content {
  margin-top: 5px !important; 
  margin-left: 5px !important; 
  // margin-right: 0px !important;
}
`;

const { detect } = require('detect-browser');
const browser = detect();

const PrepareTemplate = () => {
  
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const pathname = useSelector(selectPathname);

  const [instance, setInstance] = useState(null);
  const [dropPoint, setDropPoint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [observers, setObservers] = useState([]);
  // const [template, setTemplate] = useState();
  
  const templateId = useSelector(selectTemplateId);
  const templateRef = useSelector(selectTemplateRef);
  const templateFileName = useSelector(selectTemplateFileName);
  const preObserver = useSelector(selectObservers);
  const assignees = useSelector(selectSignees);
  // const isWithPDF = useSelector(selectIsWithPDF);
  const isWithPDF = true;   // 무조건 WithPDF 로 편집하도록 함
  const templateTitle = useSelector(selectTemplateTitle);
  const [documentTitle, setDocumentTitle] = useState(templateTitle);


  const box = assignees.map(user => {
    return { key:user.key, sign:0, text:0, checkbox:0, auto_name:0, auto_jobtitle:0, auto_office:0, auto_depart:0, auto_sabun:0, auto_date:0, observer:(preObserver.filter(v => v === user.key).length > 0)?1:0};
  });
  const [boxData, setBoxData] = useState(box);
  const [disableNext, setDisableNext] = useState(true);

  const user = useSelector(selectUser);
  const { _id, email } = user;
  
  const viewer = useRef(null);
  const pdfRef = useRef();

  const fetchSigns = async () => {
    let param = {
      user: _id
    }
    const res = await axios.post('/api/sign/signs', param);
    if (res.data.success) {
      const signs = res.data.signs;
      pdfRef.current.setSigns(signs);

    }
  }

  const initWithPDF = async () => {

    let param = {
      templateId: templateId
    }
    const res = await axios.post('/api/template/detail', param);
    if (res.data.success) {
      let _template = res.data.template;
      // setTemplate(_template);

      await pdfRef.current.uploadPDF(_template.docRef);
      await pdfRef.current.importItems(_template.items);
      await fetchSigns();

      // init boxData
      _template.items.forEach(item => {
        let member = boxData.filter(e => e.key === item.uid)[0];
        if (item.subType === TYPE_SIGN) {
          member.sign = member.sign + 1;
        } else if (item.subType === TYPE_TEXT) {
          
          if (item.autoInput) {
            if (item.autoInput === AUTO_NAME) {
              member.auto_name = member.auto_name + 1;
            } else if (item.autoInput === AUTO_JOBTITLE) {
              member.auto_jobtitle = member.auto_jobtitle + 1;
            } else if (item.autoInput === AUTO_OFFICE) {
              member.auto_office = member.auto_office + 1;
            } else if (item.autoInput === AUTO_DEPART) {
              member.auto_depart = member.auto_depart + 1;
            } else if (item.autoInput === AUTO_SABUN) {
              member.auto_sabun = member.auto_sabun + 1;
            } else if (item.autoInput === AUTO_DATE) {
              member.auto_date = member.auto_date + 1;
            }
          } else {
            member.text = member.text + 1;
          }
          
        } else if (item.subType === TYPE_CHECKBOX) {
          member.checkbox = member.checkbox + 1;
        }

        let newBoxData = boxData.slice();
        newBoxData[boxData.filter(e => e.key === user).index] = member;
        setBoxData(newBoxData);

      })
    }

  }

  useEffect(() => {

    setObservers(preObserver.filter((value) => {
      return assignees.some(v => value == v.key);
    }));
    
    initWithPDF();

  }, []);

  // observers.filter(v => v == box.key).count === 0
  useEffect(() => {

    // 유효성 체크 
    var check = false;
    boxData.map(box => {
      if(box.sign === 0 && box.text === 0 && box.observer === 0) { 
        check = true;
      }
    });
    setDisableNext(check);
  }, [boxData]);

    // WITHPDF 전송
  const send = async () => {
    console.log('send called');
    setLoading(true);  

    // PROCESS
    // 1. EXPORT ITEMS
    // 2. UPDATE TEMPLATE

    // 1. EXPORT ITEMS
    let exportItems = await pdfRef.current.exportItems();

    // 2. UPDATE TEMPLATE
    let usersOrder = [];
    let usersTodo = [];
    let orderType = 'A';

    const assigneesExceptRequester = assignees.filter(el => !el.key.includes('requester'))
    const users = assigneesExceptRequester.map(assignee => {
      return assignee.key;
    });
    assigneesExceptRequester.map(user => {
      usersOrder.push({'user': user.key, 'order': user.order});
      if (user.order == 0) {
        usersTodo.push(user.key);
      }
      if (user.order > 0) {
        orderType = 'S';
      }
    })

    let body = {
      _id: templateId,
      user: _id,
      docTitle: documentTitle,
      // customRef: customRef,
      // directRef: directRef,
      users: users,
      observers: observers,
      orderType: orderType, //SUNCHA: 순차 기능 활성화 
      usersOrder: usersOrder,
      usersTodo: usersTodo,
      signees: assigneesExceptRequester,
      hasRequester: assignees.some(v => v.key === 'requester1'),
      requesters: assignees.filter(el => el.key.includes('requester')),
      items: exportItems,
      isWithPDF: isWithPDF
    }
    
    await axios.post('/api/template/updateTemplate', body);

    dispatch(resetAssignAll());
    setLoading(false);  
    navigate(pathname? pathname : '/templateList'); 
  }

  const addField = (type, point = {}, member = {}, color = '', value = '', flag = {}) => {
    console.log('called addField');
    addBox(type, member, color);
    return;
  };

  const getToday = () => {
    var date = new Date();
    var year = date.getFullYear();
    var month = ('0' + (1 + date.getMonth())).slice(-2);
    var day = ('0' + date.getDate()).slice(-2);
    return year + month + day;
  }

  const dragOver = e => {
    e.preventDefault();
    return false;
  };

  const drop = (e, instance) => {
    // const { docViewer } = instance;
    const { Core } = instance;
    const { documentViewer } = Core;
    const scrollElement = documentViewer.getScrollViewElement();
    const scrollLeft = scrollElement.scrollLeft || 0;
    const scrollTop = scrollElement.scrollTop || 0;
    setDropPoint({ x: e.pageX + scrollLeft, y: e.pageY + scrollTop });
    e.preventDefault();
    return false;
  };

  const handleItemChanged = (action, item) => {
    console.log(action, item);

    if (action === 'add') {

      let member = boxData.filter(e => e.key === item.uid)[0];
      if (item.subType === TYPE_SIGN) {
        member.sign = member.sign + 1;
      } else if (item.subType === TYPE_TEXT) {
        
        if (item.autoInput) {
          if (item.autoInput === AUTO_NAME) {
            member.auto_name = member.auto_name + 1;
          } else if (item.autoInput === AUTO_JOBTITLE) {
            member.auto_jobtitle = member.auto_jobtitle + 1;
          } else if (item.autoInput === AUTO_OFFICE) {
            member.auto_office = member.auto_office + 1;
          } else if (item.autoInput === AUTO_DEPART) {
            member.auto_depart = member.auto_depart + 1;
          } else if (item.autoInput === AUTO_SABUN) {
            member.auto_sabun = member.auto_sabun + 1;
          } else if (item.autoInput === AUTO_DATE) {
            member.auto_date = member.auto_date + 1;
          }
        } else {
          member.text = member.text + 1;
        }
        
      } else if (item.subType === TYPE_CHECKBOX) {
        member.checkbox = member.checkbox + 1;
      }

      let newBoxData = boxData.slice();
      newBoxData[boxData.filter(e => e.key === item.uid).index] = member;
      setBoxData(newBoxData);

    } else if (action === 'delete') {

      let member = boxData.filter(e => e.key === item.uid)[0];
      if (item.subType === TYPE_SIGN) {
        member.sign = member.sign - 1;
      } else if (item.subType === TYPE_TEXT) {

        if (item.autoInput) {
          if (item.autoInput === AUTO_NAME) {
            member.auto_name = member.auto_name - 1;
          } else if (item.autoInput === AUTO_JOBTITLE) {
            member.auto_jobtitle = member.auto_jobtitle - 1;
          } else if (item.autoInput === AUTO_OFFICE) {
            member.auto_office = member.auto_office - 1;
          } else if (item.autoInput === AUTO_DEPART) {
            member.auto_depart = member.auto_depart - 1;
          } else if (item.autoInput === AUTO_SABUN) {
            member.auto_sabun = member.auto_sabun - 1;
          } else if (item.autoInput === AUTO_DATE) {
            member.auto_date = member.auto_date - 1;
          }
        } else {
          member.text = member.text - 1;
        }

      } else if (item.subType === TYPE_CHECKBOX) {
        member.checkbox = member.checkbox - 1;
      }

      let newBoxData = boxData.slice();
      newBoxData[boxData.filter(e => e.key === item.uid).index] = member;
      setBoxData(newBoxData);

    }
  }

  const addBox = (type, member, color) => {
    const sendType = ''; // 템플릿엔 bulk 없음
    if (type === 'SIGN') {
      pdfRef.current.addBox(sendType === 'B' ? 'bulk' : member.key, TYPE_SIGN, sendType === 'B' ? `SIGN` : `${member.name}<br>SIGN`, 100, 60, true, color);
    } else if (type === 'TEXT') {
      pdfRef.current.addBox(sendType === 'B' ? 'bulk' : member.key, TYPE_TEXT, 'TEXT', 120, 25, true, color);
    } else if (type === 'CHECKBOX') {
      pdfRef.current.addBox(sendType === 'B' ? 'bulk' : member.key, TYPE_CHECKBOX, 'CHECKBOX', 25, 25, true, color);
    } else if (type === 'AUTONAME') {
      pdfRef.current.addBox(sendType === 'B' ? 'bulk' : member.key, TYPE_TEXT, '이름', 100, 25, true, color, AUTO_NAME);
    } else if (type === 'AUTOJOBTITLE') {
      pdfRef.current.addBox(sendType === 'B' ? 'bulk' : member.key, TYPE_TEXT, '직급', 100, 25, true, color, AUTO_JOBTITLE);
    } else if (type === 'AUTOSABUN') {
      pdfRef.current.addBox(sendType === 'B' ? 'bulk' : member.key, TYPE_TEXT, '사번', 100, 25, true, color, AUTO_SABUN);
    } else if (type === 'AUTOOFFICE') {
      pdfRef.current.addBox(sendType === 'B' ? 'bulk' : member.key, TYPE_TEXT, '회사명', 130, 25, true, color, AUTO_OFFICE);
    } else if (type === 'AUTODEPART') {
      pdfRef.current.addBox(sendType === 'B' ? 'bulk' : member.key, TYPE_TEXT, '소속명', 130, 25, true, color, AUTO_DEPART);
    } else if (type === 'AUTODATE') {
      pdfRef.current.addBox(sendType === 'B' ? 'bulk' : member.key, TYPE_TEXT, '날짜', 130, 25, true, color, AUTO_DATE);
    }
    
  }

  const onChangeTemplateTitle = (text) => {
    if (text === '') return false;
    dispatch(setTemplateTitle(text));
    setDocumentTitle(text);
  }

  return (
    <div>
      <PageContainerStyle>
      <PageContainer
        // ghost
        header={{
          // title: '입력 설정',
          title: <Typography.Title editable={{onChange: (text) => {onChangeTemplateTitle(text)}, tooltip: false}} level={5} style={{ margin: 0, width: '500px' }} >{templateTitle}</Typography.Title>,
          ghost: true,
          breadcrumb: {
            routes: [],
          },
          extra: [
            <Button key="2" icon={<ArrowLeftOutlined />} onClick={() => {navigate('/assignTemplate');}}></Button>,
            <Button key="1" icon={<SendOutlined />} type="primary" onClick={send}  disabled={disableNext} loading={loading}>{formatMessage({id: 'Save'})}</Button>
          ]
        }}
        content= { <ProCard style={{ background: '#ffffff'}} layout="center"><StepWrite current={1} /></ProCard> }
        footer={[
        ]}
        // loading={loading}
      >
        <Row gutter={[24, 24]}>
          {/* <Col xl={6} lg={7} md={7} sm={24} xs={24}> */}
          <Col flex='250px'>
            <div>
              <List
                rowKey="id"
                loading={loading}
                grid={{ gutter: 24, lg: 1, md: 1, sm: 2, xs: 2 }}
                dataSource={assignees}
                renderItem={item =>
                  <List.Item key={item.key}>
                    <Card size="small" type="inner" title={<><Tag color="blue">{Number(item.order)+1}</Tag> {item.JOB_TITLE ? item.name+' '+item.JOB_TITLE : item.name} </>} style={{ width: '236px' }} extra={
                      <Tooltip placement="top" title={'문서에 서명 없이 문서 수신만 하는 경우'}>
                        <Checkbox onChange={e => {
                          if (e.target.checked) {
                            // observer 추가 
                            setObservers([...observers, item.key])
                            
                            // boxData 갱신
                            const member = boxData.filter(e => e.key === item.key)[0]
                            member.observer = member.observer + 1
                            member.sign = 0;
                            member.text = 0;
                            member.checkbox = 0;
                            const newBoxData = boxData.slice()
                            newBoxData[boxData.filter(e => e.key === item.key).index] = member 
                            setBoxData(newBoxData)

                            // annotation 삭제
                            pdfRef.current.deleteItemsByUserId(item.key);

                          } else {
                            // observer 삭제
                            setObservers(observers.filter(v => v != item.key))
                            
                            // boxData 갱신
                            const member = boxData.filter(e => e.key === item.key)[0]
                            member.observer = member.observer - 1
                            const newBoxData = boxData.slice()
                            newBoxData[boxData.filter(e => e.key === item.key).index] = member 
                            setBoxData(newBoxData)

                          }
                        }}

                        //   if (e.target.checked) {
                        //     // observer 추가 
                        //     setObservers([...observers, item.key]);
                        //     // boxData 갱신
                        //     const member = boxData.filter(e => e.key === item.key)[0];
                        //     member.observer = member.observer + 1;
                        //     const newBoxData = boxData.slice();
                        //     newBoxData[boxData.filter(e => e.key === item.key).index] = member;
                        //     setBoxData(newBoxData);
                        //     // annotation 삭제
                        //     const { Annotations, docViewer } = instance;
                        //     const annotManager = docViewer.getAnnotationManager();
                        //     const annotationsList = annotManager.getAnnotationsList();
                        //     const annotsToDelete = [];
                        //     annotationsList.map(async (annot, index) => {
                        //       if (annot?.custom?.name.includes(item.key)) {
                        //         annotsToDelete.push(annot);
                        //       }
                        //     });
                        //     annotManager.deleteAnnotations(annotsToDelete, null, true);
                        //   } else {
                        //     // observer 삭제
                        //     setObservers(observers.filter(v => v != item.key));
                        //     // boxData 갱신
                        //     const member = boxData.filter(e => e.key === item.key)[0];
                        //     member.observer = member.observer - 1;
                        //     const newBoxData = boxData.slice();
                        //     newBoxData[boxData.filter(e => e.key === item.key).index] = member;
                        //     setBoxData(newBoxData);
                        //   }
                        // }}
                        checked={observers.filter(v => v === item.key).length > 0}
                        disabled={item.key === 'requester1' ? true : false}
                        >수신자 지정</Checkbox>
                      </Tooltip>
                    }>
                      <p>
                      <Tooltip placement="right" title={'참여자가 사인을 입력할 위치에 넣어주세요.'}>
                        <Badge count={boxData.filter(e => e.key === item.key)[0].sign}>
                          <Button style={{width:'190px', textAlign:'left'}} disabled={observers.filter(v => v === item.key).length > 0} icon={<Icon component={IconSign} style={{ fontSize: '120%'}} />} onClick={e => { addField('SIGN', {}, item); }}>{formatMessage({id: 'input.sign'})}</Button>
                        </Badge>
                      </Tooltip>
                      </p>
                      <p>
                      <Tooltip placement="right" title={(browser && browser.name.includes('chrom') && parseInt(browser.version) < 87) ? '사용중인 브라우저의 버전이 낮습니다.(버전 87 이상 지원)' : '참여자가 텍스트를 입력할 위치에 넣어주세요.'}>
                        <Badge count={boxData.filter(e => e.key === item.key)[0].text}>
                          <Button style={{width:'91px', textAlign:'left'}} disabled={observers.filter(v => v === item.key).length > 0 || (browser && browser.name.includes('chrom') && parseInt(browser.version) < 87)} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('TEXT', {}, item); }}>{formatMessage({id: 'input.text'})}</Button>
                        </Badge>
                      </Tooltip>
                      &nbsp;&nbsp;&nbsp;
                      <Tooltip placement="right" title={(browser && browser.name.includes('chrom') && parseInt(browser.version) < 87) ? '사용중인 브라우저의 버전이 낮습니다.(버전 87 이상 지원)' : '참여자가 텍스트를 입력할 위치에 넣어주세요.'}>
                        <Badge count={boxData.filter(e => e.key === item.key)[0].checkbox}>
                          <Button style={{width:'90px', textAlign:'left'}} disabled={observers.filter(v => v === item.key).length > 0 || (browser && browser.name.includes('chrom') && parseInt(browser.version) < 87)} icon={<Icon component={IconCheckbox} style={{ fontSize: '120%'}} />} onClick={e => { addField('CHECKBOX', {}, item); }}>{formatMessage({id: 'input.checkbox'})}</Button>
                        </Badge>
                      </Tooltip>
                      </p>

                      {/*  자동 입력값 셋팅 */}
                      {item.key === 'requester1' && 
                        <div>
                        <Divider plain>자동 입력</Divider>
                        <p>
                        <Badge count={boxData.filter(e => e.key === 'requester1')[0].auto_name}>
                          <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTONAME', {}, {key: 'requester1', type: 'AUTONAME', name: "이름"}); }}>{formatMessage({id: 'name'})}</Button>
                        </Badge>
                        &nbsp;&nbsp;&nbsp;
                        <Badge count={boxData.filter(e => e.key === 'requester1')[0].auto_jobtitle}>
                          <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTOJOBTITLE', {}, {key: 'requester1', type: 'AUTOJOBTITLE', name: "직급"}); }}>{formatMessage({id: 'jobtitle'})}</Button>
                        </Badge>
                        </p>
                        <p>
                        <Badge count={boxData.filter(e => e.key === 'requester1')[0].auto_office}>
                          <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTOOFFICE', {}, {key: 'requester1', type: 'AUTOOFFICE', name: "회사명"}); }}>{formatMessage({id: 'office'})}</Button>
                        </Badge>
                        &nbsp;&nbsp;&nbsp;
                        <Badge count={boxData.filter(e => e.key === 'requester1')[0].auto_depart}>
                          <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTODEPART', {}, {key: 'requester1', type: 'AUTODEPART', name: "소속명"}); }}>{formatMessage({id: 'depart'})}</Button>
                        </Badge>
                        </p>
                        <p>
                        <Badge count={boxData.filter(e => e.key === 'requester1')[0].auto_sabun}>
                          <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTOSABUN', {}, {key: 'requester1', type: 'AUTOSABUN', name: "사번"}); }}>{formatMessage({id: 'sabun'})}</Button>
                        </Badge>
                        &nbsp;&nbsp;&nbsp;
                        <Tooltip placement="right" title={'예) 2022년 06월 10일'}>
                          <Badge count={boxData.filter(e => e.key === 'requester1')[0].auto_date}>
                            <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTODATE', {}, {key: 'requester1', type: 'AUTODEPART', name: "날짜"}); }}>{formatMessage({id: 'date'})}</Button>
                          </Badge>
                        </Tooltip>
                        </p></div>}



                    </Card>
                  </List.Item>
                }
              />
            </div>
            
            {/*  자동 입력값 셋팅 */}
            {/* {boxData.filter(e => e.key === 'requester').length > 0 && 
            <div>
            <Card size="small" type="inner" title="자동 입력" style={{ width: '240px' }}>
              <p>
              <Badge count={boxData.filter(e => e.key === 'requester')[0].auto_name}>
                <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTONAME', {}, {key: 'requester', type: 'AUTONAME', name: "이름"}); }}>{formatMessage({id: 'name'})}</Button>
              </Badge>
              &nbsp;&nbsp;&nbsp;
              <Badge count={boxData.filter(e => e.key === 'requester')[0].auto_jobtitle}>
                <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTOJOBTITLE', {}, {key: 'requester', type: 'AUTOJOBTITLE', name: "직급"}); }}>{formatMessage({id: 'jobtitle'})}</Button>
              </Badge>
              </p>
              <p>
              <Badge count={boxData.filter(e => e.key === 'requester')[0].auto_office}>
                <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTOOFFICE', {}, {key: 'requester', type: 'AUTOOFFICE', name: "회사명"}); }}>{formatMessage({id: 'office'})}</Button>
              </Badge>
              &nbsp;&nbsp;&nbsp;
              <Badge count={boxData.filter(e => e.key === 'requester')[0].auto_depart}>
                <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTODEPART', {}, {key: 'requester', type: 'AUTODEPART', name: "부서명"}); }}>{formatMessage({id: 'depart'})}</Button>
              </Badge>
              </p>
              <p>
              <Badge count={boxData.filter(e => e.key === 'requester')[0].auto_sabun}>
                <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTOSABUN', {}, {key: 'requester', type: 'AUTOSABUN', name: "사번"}); }}>{formatMessage({id: 'sabun'})}</Button>
              </Badge>
              &nbsp;&nbsp;&nbsp;
              <Badge count={boxData.filter(e => e.key === 'requester')[0].auto_date}>
                <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTODATE', {}, {key: 'requester', type: 'AUTODEPART', name: "날짜"}); }}>{formatMessage({id: 'date'})}</Button>
              </Badge>
              </p>
            </Card>
            </div>} */}



          </Col>

          <Col flex='auto'>

            <Spin tip="로딩중..." spinning={loading}>
              <PDFViewer ref={pdfRef} isUpload={false} isSave={false} isEditing={true} onItemChanged={handleItemChanged} />
            </Spin>

          </Col>
        </Row>
      </PageContainer>
      </PageContainerStyle>
    </div>
  );
};

export default PrepareTemplate;
