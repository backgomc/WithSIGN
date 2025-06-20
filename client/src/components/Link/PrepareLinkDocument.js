import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import axiosInterceptor from '../../config/AxiosConfig';
import { navigate } from '@reach/router';
// import {
//   Box,
//   Column,
//   Heading,
//   Row,
//   Stack,
//   Text,
//   Button,
//   SelectList,
// } from 'gestalt';
import { Upload, message, Badge, Button, Row, Col, List, Card, Checkbox, Tooltip, Tag, Divider, Spin, Typography } from 'antd';
import Icon, { InboxOutlined, HighlightOutlined, PlusOutlined, ArrowLeftOutlined, ArrowRightOutlined, SendOutlined } from '@ant-design/icons';
import { selectDocumentTempPath, 
         resetAssignAll,
         selectAssignees, 
         selectObservers, 
         resetSignee, 
         selectDocumentFile, 
         selectDocumentTitle, 
         setDocumentTitle,
         resetDocumentFile, 
         resetDocumentTitle, 
         selectTemplate, 
         resetTemplate, 
         selectDocumentType, 
         resetDocumentType, 
         selectTemplateTitle, 
         setTemplateTitle,
         selectSendType, 
         selectOrderType,
         selectAttachFiles,
         resetAttachFiles } from '../Assign/AssignSlice';

import { selectDirectTempPath, selectDirectTitle } from '../SignDirect/DirectSlice';
import { selectUser } from '../../app/infoSlice';
import './PrepareLinkDocument.css';
import StepWrite from '../Step/StepWrite'
import { useIntl } from 'react-intl';
import RcResizeObserver from 'rc-resize-observer';
import { PageContainer } from '@ant-design/pro-layout';
import ProCard from '@ant-design/pro-card';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import logo from '../../assets/images/logo.svg';
import { ReactComponent as IconSign} from '../../assets/images/sign.svg';
import { ReactComponent as IconText} from '../../assets/images/text.svg';
import { ReactComponent as IconCheckbox} from '../../assets/images/checkbox.svg';
import { ReactComponent as IconDropDown} from '../../assets/images/dropdown.svg';

import loadash from 'lodash';
import PDFViewer from "@niceharu/withpdf";
import {TYPE_SIGN, TYPE_IMAGE, TYPE_TEXT, TYPE_BOX, TYPE_CHECKBOX, TYPE_DROPDOWN, COLORS, AUTO_NAME, AUTO_JOBTITLE, AUTO_OFFICE, AUTO_DEPART, AUTO_SABUN, AUTO_DATE} from '../../common/Constants';
import styled, { useTheme } from 'styled-components';
const PageContainerStyle = styled.div`
.ant-pro-page-container-children-content {
  margin-top: 5px !important; 
  margin-left: 5px !important; 
  // margin-right: 0px !important;
}

.ant-pro-card-body {
  padding: 24px 24px 12px 24px;
}
`;

const { Dragger } = Upload;

const { detect } = require('detect-browser');
const browser = detect();

const PrepareLinkDocument = ({location}) => {
  const [instance, setInstance] = useState(null);
  const [dropPoint, setDropPoint] = useState(null);
  // const [fileName, setFileName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [responsive, setResponsive] = useState(false);
  const [thumbnail, setThumbnail] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [observers, setObservers] = useState([]);
  // const [inputValue, _setInputValue] = useState([new Map()]);

  const [documentFile, setDocumentFile] = useState(location?.state.documentFile ? location?.state.documentFile : null);
  const [attachFiles, setAttachFiles] = useState(location?.state.attachFiles ? location?.state.attachFiles : []);

  // event 안에서는 최신 state 값을 못 불러와서 ref 사용
  // const inputValueRef = useRef(inputValue);
  // const setInputValue = data => {
  //   inputValueRef.current = data;
  //   _setInputValue(data);
  // };

  const dispatch = useDispatch();
  const { formatMessage } = useIntl();

  // const attachFiles = useSelector(selectAttachFiles);
  // const documentFile = useSelector(selectDocumentFile);
  const documentTitle = useSelector(selectDocumentTitle);
  const documentType = useSelector(selectDocumentType);
  const template = useSelector(selectTemplate);
  const templateTitle = useSelector(selectTemplateTitle);
  const sendType = useSelector(selectSendType); // 항상 'L'이 될 것

  const [docTitle, setDocTitle] = useState((documentType === "PC") ? documentTitle : templateTitle);

  // const directTitle = useSelector(selectDirectTitle);
  // const directTempPath = useSelector(selectDirectTempPath);

  // const orderType = useSelector(selectOrderType);
  const documentTempPath = useSelector(selectDocumentTempPath);
  const preObserver = useSelector(selectObservers);
  const assignees = useSelector(selectAssignees);
  const assigneesValues = assignees.map(user => {
    return { value: user.key, label: user.name };
  });
  const box = assignees.map(user => {
    return { key:user.key, sign:0, text:0, checkbox:0, dropdown:0, auto_name:0, auto_jobtitle:0, auto_office:0, auto_depart:0, auto_sabun:0, auto_date:0, observer:(preObserver.filter(v => v === user.key).length > 0)?1:0};
  });
  
  // 링크서명은 항상 bulk 처리
  const box_bulk = [{key:'bulk', sign:0, text:0, checkbox:0, dropdown:0, auto_name:0, auto_jobtitle:0, auto_office:0, auto_depart:0, auto_sabun:0, auto_date:0}]
  const [boxData, setBoxData] = useState(box_bulk); // 링크서명은 항상 bulk

  // let initialAssignee =
  //   assigneesValues.length > 0 ? assigneesValues[0].value : '';
  let initialAssignee =
  assigneesValues.length > 0 ? assigneesValues[0] : '';
  const [assignee, setAssignee] = useState(initialAssignee);
  const [disableNext, setDisableNext] = useState(true);

  const user = useSelector(selectUser);
  const { _id, email } = user;
  const myname = user.name;

  const viewer = useRef(null);
  const pdfRef = useRef();
  const filePicker = useRef(null);

  const props = {
    name: 'file',
    multiple: false,
    // action: '',
    beforeUpload: file => {
        if (file.type !== 'application/pdf') {
            console.log(file.type)
            message.error(`${file.name} is not a pdf file`);
            return Upload.LIST_IGNORE;
        }

        instance.UI.loadDocument(file);
        // setFile(file);
                
        return false;
    },
    onChange(info) {
        console.log(info.file, info.fileList);
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
    },
  };

  // S. control inputValue map
  // const insertInputValue = (key, value) => {
  //   setInputValue((prev) => new Map([...prev, [key, value]]));
  // };
  
  
  // const updateInputValue = (key, value) => {
  //   setInputValue((prev) => new Map(prev).set(key, value));
  // }
  
  // const deleteInputValue = (key) => {
  //   setInputValue((prev) => {
  //     const newState = new Map(prev);
  //     newState.delete(key);
  //     return newState;
  //   });
  // }
  
  // const clearInputValue = () => {
  //   setInputValue((prev) => new Map(prev.clear()));
  // }
  // E. control inputValue map

  const fetchSigns = async () => {
    let param = {
      user: _id
    }
    const res = await axiosInterceptor.post('/api/sign/signs', param);
    if (res.data.success) {
      const signs = res.data.signs;
      pdfRef.current.setSigns(signs);
    }
  }

  const initWithPDF = async () => {
    if (documentType === 'TEMPLATE' || documentType === 'TEMPLATE_CUSTOM') {
      await pdfRef.current.uploadPDF(template.docRef);

      console.log('assignees', assignees)
      // 일반 전송인 경우 requester 는 제외
      let newItems = [];  

      // Uncaught (in promise) Error: Invariant failed: A state mutation was detected between dispatches 오류로 copy해서 쓰도록 함
      let asisItems = loadash.cloneDeep(template.items);

      asisItems.forEach(item => {
        // 링크서명은 항상 bulk 처리
        if(template.requesters?.some(user => user.key === item.uid)) {
          let newItem = loadash.cloneDeep(item);
          newItem.uid = 'bulk'; //requester1 -> bulk
          newItems.push(newItem);
        }

        if (!item.uid) { // 참여자에 속하지 않는 일반 컴포넌트인 경우 그냥 추가해준다.
          newItems.push(item);
        }
      })

      await pdfRef.current.importItems(newItems);

      // init boxData
      newItems.forEach(item => {
        let member = boxData.filter(e => e.key === item.uid)[0];
        if (member) {
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
        }
      })
      
    } else if (documentType === 'PC' || documentType === 'DIRECT') {
      await pdfRef.current.uploadPDF(documentTempPath);
    }

    let pageCnt = await pdfRef.current.getPageCount();
    setPageCount(pageCnt);

    await fetchSigns();
  }

  useEffect(() => {
    // 링크서명에서는 observers 처리 안함
    // if (sendType !== 'B') {
    //   setObservers(preObserver.filter((value) => {
    //     return assignees.some(v => value == v.key);
    //   }));
    // }
    initWithPDF();
  }, []);

  // observers.filter(v => v == box.key).count === 0
  useEffect(() => {
    // 유효성 체크 
    var check = false
    boxData.map(box => {
      // 링크서명에서는 서명이 필수
      if(box.sign === 0) { 
        check = true
      }
    });
    setDisableNext(check)
  }, [boxData]);

  // 일반전송 : 멤버 아이디로 필드값 저장
  // 대량전송/링크서명 : 멤버가 아닌 공통값(bulk)으로 저장
  const addField = (type, point = {}, member = {}, color = '', value = '', flag = {}) => {
    console.log('called addField')
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

  // 링크서명에서는 사용하지 않는 함수이지만 기존 로직 유지
  const send = async () => {
    console.log('send called - but not used in link signature')
    // 링크서명에서는 이 함수를 사용하지 않고 다음 버튼으로 linkSetting으로 이동
    return;
  }

  // 링크서명에서는 사용하지 않는 함수이지만 기존 로직 유지
  const uploadForSigning = async () => {
    console.log('uploadForSigning called - but not used in link signature')
    // 링크서명에서는 이 함수를 사용하지 않고 다음 버튼으로 linkSetting으로 이동
    return;
  };

  const dragOver = e => {
    e.preventDefault();
    return false;
  };

  const drop = (e, instance) => {
    const { Core } = instance;
    const { documentViewer } = Core;
    const scrollElement = documentViewer.getScrollViewElement();
    const scrollLeft = scrollElement.scrollLeft || 0;
    const scrollTop = scrollElement.scrollTop || 0;
    setDropPoint({ x: e.pageX + scrollLeft, y: e.pageY + scrollTop });
    e.preventDefault();
    return false;
  };

  const dragStart = e => {
    e.target.style.opacity = 0.5;
    const copy = e.target.cloneNode(true);
    copy.id = 'form-build-drag-image-copy';
    copy.style.width = '250px';
    document.body.appendChild(copy);
    e.dataTransfer.setDragImage(copy, 125, 25);
    e.dataTransfer.setData('text', '');
  };

  const dragEnd = (e, type) => {
    addField(type, dropPoint);
    e.target.style.opacity = 1;
    document.body.removeChild(
      document.getElementById('form-build-drag-image-copy'),
    );
    e.preventDefault();
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
      } else if (item.subType === TYPE_DROPDOWN) {
        member.dropdown = member.dropdown + 1;
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
      } else if (item.subType === TYPE_DROPDOWN) {
        member.dropdown = member.dropdown - 1;
      }

      let newBoxData = boxData.slice();
      newBoxData[boxData.filter(e => e.key === item.uid).index] = member;
      setBoxData(newBoxData);
    }
  }

  const addBox = (type, member, color) => {
    // 링크서명은 항상 bulk 처리
    if (type === 'SIGN') {
      pdfRef.current.addBox('bulk', TYPE_SIGN, `SIGN`, 100, 60, true, color);
    } else if (type === 'TEXT') {
      pdfRef.current.addBox('bulk', TYPE_TEXT, 'TEXT', 120, 25, true, color);
    } else if (type === 'CHECKBOX') {
      pdfRef.current.addBox('bulk', TYPE_CHECKBOX, 'CHECKBOX', 25, 25, true, color);
    } else if (type === 'DROPDOWN') {
      pdfRef.current.addBox('bulk', TYPE_DROPDOWN, 'DROPDOWN', 120, 25, true, color);
    } else if (type === 'AUTONAME') {
      pdfRef.current.addBox('bulk', TYPE_TEXT, '이름', 100, 25, true, color, AUTO_NAME);
    } else if (type === 'AUTOJOBTITLE') {
      pdfRef.current.addBox('bulk', TYPE_TEXT, '직급', 100, 25, true, color, AUTO_JOBTITLE);
    } else if (type === 'AUTOSABUN') {
      pdfRef.current.addBox('bulk', TYPE_TEXT, '사번', 100, 25, true, color, AUTO_SABUN);
    } else if (type === 'AUTOOFFICE') {
      pdfRef.current.addBox('bulk', TYPE_TEXT, '회사명', 130, 25, true, color, AUTO_OFFICE);
    } else if (type === 'AUTODEPART') {
      pdfRef.current.addBox('bulk', TYPE_TEXT, '소속명', 130, 25, true, color, AUTO_DEPART);
    } else if (type === 'AUTODATE') {
      pdfRef.current.addBox('bulk', TYPE_TEXT, '날짜', 130, 25, true, color, AUTO_DATE);
    }
  }

  const onChangeDocTitle = (text) => {
    if (text === '') return false;
    (documentType === "PC") ? dispatch(setDocumentTitle(text)) : dispatch(setTemplateTitle(text))
    setDocTitle(text);
  }

  // 링크서명용 다음 버튼 핸들러
  const handleNextToLinkSetting = async () => {
    // PDF 항목들 추출
    let items = await pdfRef.current.exportItems();
    
    // 썸네일 생성
    let _thumbnail = await pdfRef.current.getThumbnail(0, 0.6);
    
    // 필요한 데이터들 준비
    const linkSettingData = {
      // 기본 정보
      attachFiles: attachFiles,
      documentFile: documentFile,
      docTitle: docTitle,
      
      // PDF 관련
      items: items,
      pageCount: pageCount,
      thumbnail: _thumbnail,
      
      // 기타 설정들
      documentType: documentType,
      templateTitle: templateTitle,
      documentTempPath: documentTempPath
    };
    
    navigate('/linkSetting', { state: linkSettingData });
  };

  return (
    // <div className={'prepareDocument'}>
    <div>
    <PageContainerStyle>
    <PageContainer  
      // ghost
      header={{
        title: <Typography.Title editable={{onChange: (text) => {onChangeDocTitle(text)}, tooltip: false}} level={5} style={{ margin: 0 }} >{docTitle}</Typography.Title>,
        ghost: true,
        breadcrumb: {
          routes: [
          ],
        },
        extra: [
          <Button key="3" icon={<ArrowLeftOutlined />} onClick={() => {
            // 링크서명인 경우 문서등록으로 이동
            navigate(`/uploadDocument`, { state: {attachFiles: attachFiles, documentFile: documentFile} });
          }}></Button>,
          
          // 링크서명은 "다음" 버튼
          <Button key="2" icon={<ArrowRightOutlined />} type="primary" onClick={handleNextToLinkSetting} disabled={disableNext}>
            다음
          </Button>
        ],
      }}
      style={{height:`calc(100vh + 200px)`}}
      content= { 
        <ProCard style={{ background: '#ffffff'}} layout="center">
          <StepWrite 
            current={1}  // 링크서명은 1단계(입력설정)
            documentFile={documentFile} 
            attachFiles={attachFiles} 
          />
        </ProCard> 
      }
      // footer={[
      // ]}
      // loading={loading}
    >

      {/* <RcResizeObserver
      key="resize-observer"
      onResize={(offset) => {
        setResponsive(offset.width < 596);
      }}
      > */}
        <Row gutter={[24, 24]}>
          {/* <Col span={responsive ? 24 : 5}> */}
          {/* <Col flex='250px' xl={6} lg={7} md={7} sm={24} xs={24}> */}
          <Col flex='250px'>

            {/* 링크서명 발송 - 항상 bulk 처리 */}
            <div>
              <Card size="small" type="inner" title="서명 참여자" style={{ width: '220px' }}>
                    <Tooltip block placement="right" title={'참여자가 사인을 입력할 위치에 넣어주세요.'}>
                      <Badge count={boxData.filter(e => e.key === 'bulk')[0] ? boxData.filter(e => e.key === 'bulk')[0].sign : 0}>
                        <Button style={{width:'91px', textAlign:'left'}} icon={<Icon component={IconSign} style={{ fontSize: '120%'}} />} onClick={e => { addField('SIGN', {}, {key: 'bulk'}); }}>{formatMessage({id: 'input.sign'})}</Button>
                      </Badge>
                    </Tooltip>
                    &nbsp;&nbsp;&nbsp;
                    <Tooltip placement="right" title={'참여자가 텍스트를 입력할 위치에 넣어주세요.'}>
                      <Badge count={boxData.filter(e => e.key === 'bulk')[0] ? boxData.filter(e => e.key === 'bulk')[0].text : 0}>
                        <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('TEXT', {}, {key: 'bulk'}); }}>{formatMessage({id: 'input.text'})}</Button>
                      </Badge>
                    </Tooltip>
                    <p></p>
                    <Tooltip placement="right" title={'참여자가 체크박스를 입력할 위치에 넣어주세요.'}>
                      <Badge count={boxData.filter(e => e.key === 'bulk')[0] ? boxData.filter(e => e.key === 'bulk')[0].checkbox : 0}>
                        <Button style={{width:'91px', textAlign:'left'}} icon={<Icon component={IconCheckbox} style={{ fontSize: '120%'}} />} onClick={e => { addField('CHECKBOX', {}, {key: 'bulk'}); }}>{formatMessage({id: 'input.checkbox'})}</Button>
                      </Badge>
                    </Tooltip>
                    &nbsp;&nbsp;&nbsp;
                    <Tooltip placement="right" title={'참여자가 드롭다운을 선택할 위치에 넣어주세요.'}>
                      <Badge count={boxData.filter(e => e.key === 'bulk')[0] ? boxData.filter(e => e.key === 'bulk')[0].dropdown : 0}>
                        <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconDropDown} style={{ fontSize: '120%'}} />} onClick={e => { addField('DROPDOWN', {}, {key: 'bulk'}); }}>{formatMessage({id: 'input.dropdown'})}</Button>
                      </Badge>
                    </Tooltip>

                    <div>
                      <Divider plain>자동 입력</Divider>
                      <p>
                      <Badge count={boxData.filter(e => e.key === 'bulk')[0]?.auto_name}>
                        <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTONAME', {}, {key: 'bulk', type: 'AUTONAME', name: "이름"}); }}>{formatMessage({id: 'name'})}</Button>
                      </Badge>
                      &nbsp;&nbsp;&nbsp;
                      <Badge count={boxData.filter(e => e.key === 'bulk')[0]?.auto_jobtitle}>
                        <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTOJOBTITLE', {}, {key: 'bulk', type: 'AUTOJOBTITLE', name: "직급"}); }}>{formatMessage({id: 'jobtitle'})}</Button>
                      </Badge>
                      </p>
                      <p>
                      <Badge count={boxData.filter(e => e.key === 'bulk')[0]?.auto_office}>
                        <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTOOFFICE', {}, {key: 'bulk', type: 'AUTOOFFICE', name: "회사명"}); }}>{formatMessage({id: 'office'})}</Button>
                      </Badge>
                      &nbsp;&nbsp;&nbsp;
                      <Badge count={boxData.filter(e => e.key === 'bulk')[0]?.auto_depart}>
                        <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTODEPART', {}, {key: 'bulk', type: 'AUTODEPART', name: "팀명"}); }}>{formatMessage({id: 'depart'})}</Button>
                      </Badge>
                      </p>
                      <p>
                      <Badge count={boxData.filter(e => e.key === 'bulk')[0]?.auto_sabun}>
                        <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTOSABUN', {}, {key: 'bulk', type: 'AUTOSABUN', name: "사번"}); }}>{formatMessage({id: 'sabun'})}</Button>
                      </Badge>
                      &nbsp;&nbsp;&nbsp;
                      <Badge count={boxData.filter(e => e.key === 'bulk')[0]?.auto_date}>
                        <Button style={{width:'90px', textAlign:'left'}} icon={<Icon component={IconText} style={{ fontSize: '120%'}} />} onClick={e => { addField('AUTODATE', {}, {key: 'bulk', type: 'AUTODATE', name: "날짜"}); }}>{formatMessage({id: 'date'})}</Button>
                      </Badge>
                      </p>
                    </div>
              </Card>
            </div>

          </Col>
          {/* <Col span={responsive ? 24 : 19}> */}
          {/* <Col flex='auto' xl={18} lg={17} md={17} sm={24} xs={24}> */}
          <Col flex='auto'>

            {/* <div className="webviewer" ref={viewer}></div> */}

            <Spin tip="로딩중..." spinning={loading}>
              <PDFViewer ref={pdfRef} isUpload={false} isSave={false} isEditing={true} onItemChanged={handleItemChanged} defaultScale={1.0} />
            </Spin>

          </Col>
        </Row>

      {/* </RcResizeObserver> */}

    </PageContainer>
    </PageContainerStyle>
    
    </div>
  );
};

export default PrepareLinkDocument;