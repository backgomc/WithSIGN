import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { navigate } from '@reach/router';
import { Badge, Button, Row, Col, List, Card, Checkbox, Tooltip, Tag } from 'antd';
import { PlusOutlined, ArrowLeftOutlined, SendOutlined } from '@ant-design/icons';
import { selectSignees, selectObservers, selectTemplateId, selectTemplateRef, selectTemplateFileName, resetAssignAll } from './AssignTemplateSlice';
import { selectUser } from '../../app/infoSlice';
import WebViewer from '@pdftron/webviewer';
import './PrepareTemplate.css';
import StepWrite from '../PrepareTemplate/StepTemplate';
import { useIntl } from 'react-intl';
import { PageContainer } from '@ant-design/pro-layout';
import ProCard from '@ant-design/pro-card';
import 'antd/dist/antd.css';
import '@ant-design/pro-card/dist/card.css';
import { LICENSE_KEY } from '../../config/Config';

const PrepareTemplate = () => {
  
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();

  const [instance, setInstance] = useState(null);
  const [dropPoint, setDropPoint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [observers, setObservers] = useState([]);
  
  const templateId = useSelector(selectTemplateId);
  const templateRef = useSelector(selectTemplateRef);
  const templateFileName = useSelector(selectTemplateFileName);
  const preObserver = useSelector(selectObservers);
  const assignees = useSelector(selectSignees);
  const box = assignees.map(user => {
    return { key:user.key, sign:0, text:0, observer:(preObserver.filter(v => v === user.key).length > 0)?1:0};
  });
  const [boxData, setBoxData] = useState(box);
  const [disableNext, setDisableNext] = useState(true);

  const user = useSelector(selectUser);
  const { _id, email } = user;
  
  const viewer = useRef(null);

  // const props = {
  //   name: 'file',
  //   multiple: false,
  //   // action: '',
  //   beforeUpload: file => {
  //     if (file.type !== 'application/pdf') {
  //         console.log(file.type);
  //         message.error(`${file.name} is not a pdf file`);
  //         return Upload.LIST_IGNORE;
  //     }
  //     instance.loadDocument(file);
  //     return false;
  //   },
  //   onChange(info) {
  //     console.log(info.file, info.fileList);
  //   },
  //   onDrop(e) {
  //     console.log('Dropped files', e.dataTransfer.files);
  //   },
  // };

  // if using a class, equivalent of componentDidMount
  useEffect(() => {

    setObservers(preObserver.filter((value) => {
      return assignees.some(v => value == v.key);
    }));
    
    WebViewer(
      {
        path: 'webviewer',
        licenseKey: LICENSE_KEY,
        disabledElements: [
          'ribbons',
          'toggleNotesButton',
          'searchButton',
          'menuButton',
        ],
      },
      viewer.current,
    ).then(async instance => {
      const { iframeWindow, docViewer, CoreControls } = instance;
      
      // set the ribbons(상단 그룹) and second header
      instance.enableElements(['ribbons']);
      instance.disableElements(['toolbarGroup-View', 'toolbarGroup-Shapes', 'toolbarGroup-Measure', 'toolbarGroup-Edit']);
      instance.setToolbarGroup('toolbarGroup-View');

      // set local font 
      CoreControls.setCustomFontURL('/webfonts/');

      // set language
      instance.setLanguage('ko');

      // copy 방지 
      instance.disableFeatures(instance.Feature.Copy);

      // 포커스 
      docViewer.setToolMode(docViewer.getTool('Pan'));

      setInstance(instance);

      const iframeDoc = iframeWindow.document.body;
      iframeDoc.addEventListener('dragover', dragOver);
      iframeDoc.addEventListener('drop', e => {
        drop(e, instance);
      });

      instance.loadDocument('/'+templateRef);

      docViewer.on('documentLoaded', () => {
        console.log('documentLoaded called');

        // 디폴트 설정
        // docViewer.setToolMode(docViewer.getTool('AnnotationCreateFreeText'));

        // 페이지 저장
        setPageCount(docViewer.getPageCount());
      });

      const annotManager = docViewer.getAnnotationManager();

      annotManager.on('annotationChanged', (annotations, action, info) => {

        console.log('called annotationChanged:'+ action);

        const { Annotations, docViewer, Font } = instance;
        let firstChk = false;

        annotations.forEach(function(annot) {
          console.log(annot.getCustomData('id'));
          // 템플릿 항목 설정 체크
          if (annot.getCustomData('id') && annot.getCustomData('id').endsWith('CUSTOM')) {
            let name = annot.getCustomData('id'); // sample: 6156a3c9c7f00c0d4ace4744_SIGN_CUSTOM
            let user = name.split('_')[0];
            let type = name.split('_')[1];
            
            firstChk = true;

            // boxData 와 일치하는 annotation 없을 경우 삭제 (퇴사자)
            console.log(boxData);

            let member = boxData.filter(e => e.key === user)[0];
            console.log(member);
            if (name.includes('SIGN')) {
              member.sign = member.sign + 1;
            } else if (name.includes('TEXT')) {
              member.text = member.text + 1;
            }
            let newBoxData = boxData.slice();
            newBoxData[boxData.filter(e => e.key === user).index] = member;
            setBoxData(newBoxData);

            // annotation 구분값 복원
            annot.FontSize = '' + 18.0 / docViewer.getZoom() + 'px';
            annot.custom = {
              type,
              name : user + '_' + type
            }
            annot.deleteCustomData('id');
          }
        });
        
        // TODO : 자유 텍스트 상단 짤리는 문제 ...
        console.log(annotations[0].Subject, annotations[0].ToolName, annotations[0].TextAlign);
        if (annotations[0].ToolName && annotations[0].ToolName.startsWith('AnnotationCreateFreeText') && action === 'add') {
          annotations[0].TextAlign = 'center';
          annotations[0].setPadding(new Annotations.Rect(0, 0, 0, 2)); // left bottom right top 
          annotations[0].Font = 'monospace';
        }
        
        // 최초 실행 또는 applyFields 에서 호출 시는 아래가 호출되지 않도록 처리 
        if (firstChk || !annotations[0].custom) {
          return;
        } 

        //TODO
        // 해당 메서드에서는 state 값을 제대로 못불러온다 ... 
        // Ref 를 써서 해결 ...
        if (action === 'add') {
          console.log('added annotation');

          const name = annotations[0].custom.name; //sample: 6156a3c9c7f00c0d4ace4744_SIGN_
          const user = name.split('_')[0];

          const member = boxData.filter(e => e.key === user)[0];

          if (name.includes('SIGN')) {
            member.sign = member.sign + 1;
          } else if (name.includes('TEXT')) {
            member.text = member.text + 1;
          }

          const newBoxData = boxData.slice();
          newBoxData[boxData.filter(e => e.key === user).index] = member;
          
          setBoxData(newBoxData);

          // 0: {key: '6156a3c9c7f00c0d4ace4744', sign: 0, text: 0}
          // 1: {key: '6156a3c9c7f00c0d4ace4746', sign: 0, text: 0}

          // setBoxData( (prev) => [...prev, {key:123, sign:1, text:2}] );
          // setBoxData([{key: '6156a3c9c7f00c0d4ace4744', sign: 1, text: 0}, {key: '6156a3c9c7f00c0d4ace4746', sign: 0, text: 0}])

        } else if (action === 'modify') {
          console.log('this change modified annotations');
        } else if (action === 'delete') {
          console.log('deleted annotation:'+ annotations);

          // annotation 이 동시 삭제되는 경우 처리 : observer 체크 시 
          annotations.map(annotation => {
            const name = annotation.custom.name;  //sample: 6156a3c9c7f00c0d4ace4744_SIGN_
            const user = name.split('_')[0];
            const member = boxData.filter(e => e.key === user)[0];
  
            if (name.includes('SIGN')) {
              member.sign = member.sign - 1;
            } else if (name.includes('TEXT')) {
              member.text = member.text - 1;
            }
  
            const newBoxData = boxData.slice();
            newBoxData[boxData.filter(e => e.key === user).index] = member;
            
            setBoxData(newBoxData);
          });
        }
      });

      // 내 사인 이미지 가져와서 출력하기
      const res = await axios.post('/api/sign/signs', {user: _id});
      if (res.data.success) {
        const signs = res.data.signs;
        var signDatas = [];
        signs.forEach(element => {
          signDatas.push(element.signData);
        });

        if (signDatas.length > 0) {
          const signatureTool = docViewer.getTool('AnnotationCreateSignature');
          docViewer.on('documentLoaded', () => {
            signatureTool.importSignatures(signDatas);
          });
        }
      }
    });
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

  const applyFields = async () => {

    console.log('applyFields called');
    
    const { docViewer } = instance;
    const annotManager = docViewer.getAnnotationManager();
    const annotationsList = annotManager.getAnnotationsList();

    await Promise.all(
      annotationsList.map(async (annot) => {
        if (annot.custom) {
          console.log(annot.custom);
          annot.setCustomData('id', annot.custom.name + 'CUSTOM');  // 템플릿 항목 설정 표시
        }
      })
    );

    await uploadForSigning();
  };

  const addField = (type, point = {}, member = {}, name = '', value = '', flag = {}) => {

    console.log('called addField');

    const { docViewer, Annotations } = instance;
    const annotManager = docViewer.getAnnotationManager();
    const doc = docViewer.getDocument();
    const displayMode = docViewer.getDisplayModeManager().getDisplayMode();
    const page = displayMode.getSelectedPages(point, point);
    if (!!point.x && page.first == null) {
      return; //don't add field to an invalid page location
    }
    const page_idx = page.first !== null ? page.first : docViewer.getCurrentPage();
    const page_info = doc.getPageInfo(page_idx);
    const page_point = displayMode.windowToPage(point, page_idx);
    const zoom = docViewer.getZoom();

    var textAnnot = new Annotations.FreeTextAnnotation();
    textAnnot.PageNumber = page_idx;
    const rotation = docViewer.getCompleteRotation(page_idx) * 90;
    textAnnot.Rotation = rotation;
    if (rotation === 270 || rotation === 90) {
      textAnnot.Width = 50.0 / zoom;
      textAnnot.Height = 250.0 / zoom;
    } else {
      if (type == 'SIGN') {
        textAnnot.Width = 90.0 / zoom;
        textAnnot.Height = 60.0 / zoom;
      } else if (type == 'TEXT') {
        textAnnot.Width = 200.0 / zoom;
        textAnnot.Height = 30.0 / zoom;
      } else {
        textAnnot.Width = 250.0 / zoom;
        textAnnot.Height = 30.0 / zoom;
      }
    }
    textAnnot.X = (page_point.x || page_info.width / 2) - textAnnot.Width / 2;
    textAnnot.Y = (page_point.y || page_info.height / 2) - textAnnot.Height / 2;

    textAnnot.setPadding(new Annotations.Rect(0, 0, 0, 0));
    textAnnot.custom = {
      type,
      value,
      flag,
      name: `${member.key}_${type}_`
    };

    // set the type of annot
    textAnnot.setContents(member.name+(type==='SIGN'?'\n'+type:' '+type));
    textAnnot.FontSize = '' + 18.0 / zoom + 'px';
    textAnnot.FillColor = new Annotations.Color(211, 211, 211, 0.5);
    textAnnot.TextColor = new Annotations.Color(0, 165, 228);
    textAnnot.StrokeThickness = 1;
    textAnnot.StrokeColor = new Annotations.Color(0, 165, 228);
    textAnnot.TextAlign = 'center';
    textAnnot.Author = annotManager.getCurrentUser();

    annotManager.deselectAllAnnotations();
    annotManager.addAnnotation(textAnnot, true);
    annotManager.redrawAnnotation(textAnnot);
    annotManager.selectAnnotation(textAnnot);
  };

  const getToday = () => {
    var date = new Date();
    var year = date.getFullYear();
    var month = ('0' + (1 + date.getMonth())).slice(-2);
    var day = ('0' + date.getDate()).slice(-2);
    return year + month + day;
  }

  const uploadForSigning = async () => {

    const path = 'templates/';
    const { docViewer, annotManager } = instance;
    const doc = docViewer.getDocument();
    const xfdfString = await annotManager.exportAnnotations({ widgets: true, fields: true });
    const data = await doc.getFileData({ xfdfString });
    const arr = new Uint8Array(data);
    const blob = new Blob([arr], { type: 'application/pdf' });
    const users = assignees.map(assignee => {
      return assignee.key;
    });
    
    setLoading(true);
    
    // 1. SAVE FILE
    let formData = new FormData();
    formData.append('path', path);
    formData.append('file', blob, templateFileName);
    let res = await axios.post('/api/storage/upload', formData);
    console.log(res);

    // 업로드 후 파일 경로 가져오기  
    var customRef = '';
    if (res.data.success) {
      customRef = res.data.file.path;
    }

    // 2. UPDATE DOCUMENT
    var usersOrder = [];
    var usersTodo = [];
    var orderType = 'A';
    assignees.map(user => {
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
      customRef: customRef,
      users: users,
      observers: observers,
      orderType: orderType, //SUNCHA: 순차 기능 활성화 
      usersOrder: usersOrder,
      usersTodo: usersTodo,
      signees: assignees
    }
    
    res = await axios.post('/api/template/updateTemplate', body);
    console.log(res);

    dispatch(resetAssignAll());
    setLoading(false);

    navigate('/templateList'); 
  };

  const dragOver = e => {
    e.preventDefault();
    return false;
  };

  const drop = (e, instance) => {
    const { docViewer } = instance;
    const scrollElement = docViewer.getScrollViewElement();
    const scrollLeft = scrollElement.scrollLeft || 0;
    const scrollTop = scrollElement.scrollTop || 0;
    setDropPoint({ x: e.pageX + scrollLeft, y: e.pageY + scrollTop });
    e.preventDefault();
    return false;
  };

  return (
    <div>
      <PageContainer
        // ghost
        header={{
          title: '템플릿 참여자 설정',
          ghost: true,
          breadcrumb: {
            routes: [],
          },
          extra: [
            <Button key="3" icon={<ArrowLeftOutlined />} onClick={() => {navigate('/assignTemplate');}}></Button>,
            <Button key="2" icon={<SendOutlined />} type="primary" onClick={applyFields} disabled={disableNext} loading={loading}>{formatMessage({id: 'Save'})}</Button>
          ]
        }}
        content= { <ProCard style={{ background: '#ffffff'}} layout="center"><StepWrite current={2} /></ProCard> }
        footer={[
        ]}
        loading={loading}
      >
        <Row gutter={[24, 24]}>
          <Col xl={4} lg={4} md={4} sm={24} xs={24}>
            <div>
              <List
                rowKey="id"
                loading={loading}
                grid={{ gutter: 24, lg: 1, md: 1, sm: 2, xs: 2 }}
                dataSource={assignees}
                renderItem={item =>
                  <List.Item key={item.key}>
                    <Card size="small" type="inner" title={<><Tag color="blue">{Number(item.order)+1}</Tag> {item.JOB_TITLE ? item.name+' '+item.JOB_TITLE : item.name} </>} style={{ width: '240px' }} extra={
                      <Tooltip placement="top" title={'문서에 서명 없이 문서 수신만 하는 경우'}>
                        <Checkbox onChange={e => {
                          if (e.target.checked) {
                            // observer 추가 
                            setObservers([...observers, item.key]);
                            // boxData 갱신
                            const member = boxData.filter(e => e.key === item.key)[0];
                            member.observer = member.observer + 1;
                            const newBoxData = boxData.slice();
                            newBoxData[boxData.filter(e => e.key === item.key).index] = member;
                            setBoxData(newBoxData);
                            // annotation 삭제
                            const { Annotations, docViewer } = instance;
                            const annotManager = docViewer.getAnnotationManager();
                            const annotationsList = annotManager.getAnnotationsList();
                            const annotsToDelete = [];
                            annotationsList.map(async (annot, index) => {
                              if (annot?.custom?.name.includes(item.key)) {
                                annotsToDelete.push(annot);
                              }
                            });
                            annotManager.deleteAnnotations(annotsToDelete, null, true);
                          } else {
                            // observer 삭제
                            setObservers(observers.filter(v => v != item.key));
                            // boxData 갱신
                            const member = boxData.filter(e => e.key === item.key)[0];
                            member.observer = member.observer - 1;
                            const newBoxData = boxData.slice();
                            newBoxData[boxData.filter(e => e.key === item.key).index] = member;
                            setBoxData(newBoxData);
                          }
                        }}
                        checked={observers.filter(v => v === item.key).length > 0}
                        >수신자 지정</Checkbox>
                      </Tooltip>
                    }>
                      <Tooltip placement="right" title={'참여자가 사인을 입력할 위치에 넣어주세요.'}>
                        <Badge count={boxData.filter(e => e.key === item.key)[0].sign}>
                          <Button style={{width:'190px', textAlign:'left'}} disabled={observers.filter(v => v === item.key).length > 0} icon={<PlusOutlined />} onClick={e => { addField('SIGN', {}, item); }}>{formatMessage({id: 'input.sign'})}</Button>
                        </Badge>
                      </Tooltip>
                      <p></p>
                      <Tooltip placement="right" title={'참여자가 텍스트를 입력할 위치에 넣어주세요.'}>
                        <Badge count={boxData.filter(e => e.key === item.key)[0].text}>
                          <Button style={{width:'190px', textAlign:'left'}} disabled={observers.filter(v => v === item.key).length > 0} icon={<PlusOutlined />} onClick={e => { addField('TEXT', {}, item); }}>{formatMessage({id: 'input.text'})}</Button>
                        </Badge>
                      </Tooltip>
                    </Card>
                  </List.Item>
                }
              />
            </div>
          </Col>
          <Col xl={20} lg={20} md={20} sm={24} xs={24}>
            <div className="webviewer" ref={viewer}></div>
          </Col>
        </Row>
      </PageContainer>
    </div>
  );
};

export default PrepareTemplate;
