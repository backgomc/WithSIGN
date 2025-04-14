import React, { Fragment, useEffect, useState, useRef, useCallback } from 'react';
import useDidMountEffect from './Common/useDidMountEffect';
import SvgScale from './SvgScale';
// import SvgDelete from './SvgDelete';
import { Pannable } from 'react-pannable';
import clsx from 'clsx';
import './Box.css';
import './tailwind.css';
import SvgDelete from './assets/images/delete.svg';
import SvgEdit from './assets/images/edit.svg';
import SvgResizeWidth from './assets/images/resize-width.svg';
import SvgResizeBoth from './assets/images/resize-both.svg';
import { InputNumber, Input, Segmented, Switch, Button } from 'antd';
import SvgTextSize from './assets/svg/SvgTextSize';
import Icon, { AlignCenterOutlined, AlignLeftOutlined, AlignRightOutlined, CloseOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { TYPE_SIGN, TYPE_TEXT, TYPE_CHECKBOX, TYPE_IMAGE, TYPE_DROPDOWN } from './Common/Constants';
// const EditorArea = styled.button`
//   border: none;
//   margin-left: -8px;
//   background-color: transparent;
//   &:hover{  
//     background-color : transparent;
//     color: transparent;
//   }
// `;
const EditorArea = styled.button`
  border: 1px rgba(0, 0, 0, 0.2) solid;
  border-radius: 5px;
  box-shadow: 3px 3px 3px rgba(229, 230, 245, 1.0);
  margin-top: 5px;
  margin-left: -8px;
  padding: 5px;
  // background-color: rgba(149, 191, 230, 1.0);
  background-color: rgba(229, 230, 245, 1.0);
  // &:hover{  
  //   background-color : transparent;
  //   color: transparent;
  // }
`;

const StyledBox = styled.div`
  border: 1px solid ${(props) => props.color || "gray"};
  background-color: rgba(193, 193, 193, 0.3);
`;

const Box = ({item, deleteItem, updateItem, pageSize, pagesScale, scaleDirection}) => {

  // const [transform, setTransform] = useState({
  //   width: item.width,
  //   height: item.subType !== TYPE_TEXT ? item.height : '',
  //   x: item.x ? item.x * pagesScale : 0,
  //   y: item.y ? item.y * pagesScale : 0,
  //   rotate: 0,
  //   // lines: item.lines
  // });

  const [transform, setTransform] = useState({
    width: 50,
    height: 50,
    x: 0,
    y: 0,
    rotate: 0,
  });


  const [drag, setDrag] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [editing, setEditing] = useState(false);  
  const [operation, setOperation] = useState();
  const [fontSize, setFontSize] = useState(item.fontSize ? item.fontSize : 16);
  const [textAlign, setTextAlign] = useState(item.textAlign ? item.textAlign : ((item.subType === TYPE_SIGN || item.subType === TYPE_CHECKBOX) ? 'center' : 'left'));
  const [inputs, setInputs] = useState(item.inputs && item.inputs.length > 0 ? item.inputs : [] );

  const transformRef = useRef();
  const canvasRef = useRef();
  transformRef.current = transform;
  const textRef = useRef();
  const fontSizeRef = useRef();
  const labelRef = useRef();


  useEffect(() => {

    // console.log("Box useEffect called!", item);

    setTransform({
      width: item.width,
      // height: item.subType !== TYPE_TEXT ? item.height : '',
      height: item.height ? item.height : '',
      x: item.x ? item.x * pagesScale : 0,
      y: item.y ? item.y * pagesScale : 0,
      rotate: 0,
      // lines: item.lines
    })

    render();

  }, []);

  // 컴포넌트가 선택되면 focus 주기
  // 빈 영역 클릭 시 focus 에 해제되어 blur event가 콜 되고 이때 편집모드를 해제 할 수 있다.
  useEffect(() => {
    if (editing && labelRef.current) {
      labelRef.current.focus();      
    }
  }, [editing]);
  
  // pagesScale 이 변경되었을때 처리
  useDidMountEffect(() => {

    // if (scaleDirection === 'up') {
    //   setTransform((prevTransform) => ({
    //     ...prevTransform,
    //     x: prevTransform.x * pagesScale / (pagesScale - 0.1),
    //     y: prevTransform.y * pagesScale / (pagesScale - 0.1)
    //   }));
    // } else if (scaleDirection === 'down') {  //down
    //   if (pagesScale === 0.9) {
    //     setTransform((prevTransform) => ({
    //       ...prevTransform,
    //       x: prevTransform.x * pagesScale,
    //       y: prevTransform.y * pagesScale
    //     }));
    //   } else {
    //     setTransform((prevTransform) => ({
    //       ...prevTransform,
    //       x: prevTransform.x *  / (pagesScale + 0.1),
    //       y: prevTransform.y * pagesScale / (pagesScale + 0.1)
    //     }));
    //   }
    // }


    // console.log('pageSize.width', pageSize?.width)
    // console.log('pagesScale', pagesScale)
    // console.log('transform.width', transform.width)

    setTransform((prevTransform) => ({
      ...prevTransform,
      x: item.x * pagesScale,
      y: item.y * pagesScale
    }));

  }, [pagesScale]);

  const render = async () => {

    console.log("render called")

    if (item.subType === TYPE_DROPDOWN && item.inputs.length == 0) {
      addInput();
    }

    if (item.subType === TYPE_CHECKBOX) {
      // checkBox 컴포넌트와 동일한 위치/사이즈로 조절
      textRef.current.innerHTML = `<input type="checkbox" style="margin-top: 3px; width: 17px; height: 17px;" />`;
    } else {
      textRef.current.innerHTML = item.text;
      // textRef.current.innerHTML = item.label;
      // textRef.current.focus();
  
      updateItem(item.id, {lines : extractLines()});
    }

  }

  const onEdit = useCallback(() => {
    setDisabled(false);
  }, []);

  const shouldStart = useCallback(({ target }) => !!getDragAction(target), []);

  const onStart = useCallback(({ target }) => {
    const action = getDragAction(target);

    setDrag({ action, startTransform: transformRef.current });
  }, []);

  const onMove = useCallback(
    ({ translation }) => {
      if (!drag) {
        return;
      }

      const { action, startTransform } = drag;

      // console.log('pageWidth', pageSize.width);
      // console.log('pageHeight', pageSize.height);
      // console.log('startTransform.x', startTransform.x);
      // console.log('translation.x', translation.x);
      // console.log('transform.width', transform.width);
      // console.log('transform.height', transform.height);

      if (action === 'translate') {

        // 영역 제한
        let _x = startTransform.x + translation.x;
        if (startTransform.x + translation.x <= 0) {
          _x = 0;
        } else if ( startTransform.x + translation.x >= (pageSize.width - transform.width * pagesScale)) {
          _x = (pageSize.width - transform.width * pagesScale);
        }

        let _y = startTransform.y + translation.y;

        if (item.subType === TYPE_TEXT || item.subType === TYPE_DROPDOWN) {
          let textHeight =  item.fontSize * item.lineHeight * extractLines().length; 
          if (startTransform.y + translation.y <= 0) {
            _y = 0;
          } else if ( startTransform.y + translation.y >= (pageSize.height - textHeight * pagesScale)) {
            _y = (pageSize.height - textHeight * pagesScale);
          }
        } else {
          if (startTransform.y + translation.y <= 0) {
            _y = 0;
          } else if ( startTransform.y + translation.y >= (pageSize.height - transform.height * pagesScale)) {
            _y = (pageSize.height - transform.height * pagesScale);
          }
        }
            
        setTransform((prevTransform) => ({
          ...prevTransform,
          x: _x,
          y: _y,
          // x: startTransform.x + translation.x,
          // y: startTransform.y + translation.y,
        }));

        // updateItem(item.id, transformRef.current);
        updateItem(item.id, {x: parseInt(_x / pagesScale), y: parseInt(_y / pagesScale), width:transformRef.current.width});


      }
      if (action === 'scale') {

        // 영역 제한 
        let _width = startTransform.width + translation.x;
        if (transformRef.current.x + (startTransform.width + translation.x) * pagesScale > pageSize.width) {
         return;
        }

        let _height = startTransform.height + translation.y;
        if (transformRef.current.y + (startTransform.height + translation.y) * pagesScale > pageSize.height) {
         return;
        }

        if (item.subType === TYPE_TEXT || item.subType === TYPE_DROPDOWN) {

        // 텍스트 사이즈에 맞춰 높이를 설정
        _height = parseInt(_height / (item.fontSize * item.lineHeight)) * (item.fontSize * item.lineHeight)
        // console.log('_height 1', _height)
        // console.log('_height 2', item.fontSize)
        // console.log('_height 3', item.lineHeight)

        // 사이즈를 placeholder 보다 줄이면 _height 가 0이 되어 최소 높이 값을 셋팅 함 
        if (_height === 0) _height = item.fontSize * item.lineHeight;

          setTransform((prevTransform) => ({
            ...prevTransform,
            width: Math.max(25, _width),
            height: Math.max(item.fontSize * item.lineHeight, _height)
          }));
        } else {
          setTransform((prevTransform) => ({
            ...prevTransform,
            width: Math.max(25, _width),
            height: Math.max(15, _height),
          }));
        }

        // updateItem(item.id, transformRef.current);
        updateItem(item.id, {x: transformRef.current.x / pagesScale, y: transformRef.current.y / pagesScale, width: Math.max(25, _width), height: Math.max(15, _height)});

      }
    },
    [drag]
  );

  const onEnd = useCallback(() => {
    console.log('onEnd called');
    setDrag(null);
    setEditing(false);
  }, []);

  const onMouseDown = useCallback((e) => {
    console.log('onMouseDown called #1');
    textRef.current.focus();
    e.stopPropagation();   
  }, []);
  

  function getDragAction(target) {
    if (target.dataset) {
      if (target.dataset.action) {
        return target.dataset.action;
      }
  
      if (target.dataset.dragbox) {
        return null;
      }
    }
  
    if (target.parentNode) {
      return getDragAction(target.parentNode);
    }
  
    return null;
  }
  
  function convertTransform(transform) {
    // return {
    //   width: transform.width,
    //   height: transform.height,
    //   transform: `translate3d(${transform.x}px, ${transform.y}px, 0) rotate(${transform.rotate})`,
    //   WebkitTransform: `translate3d(${transform.x}px, ${transform.y}px, 0) rotate(${transform.rotate}rad)`,
    //   msTransform: `translate(${transform.x}px, ${transform.y}px) rotate(${transform.rotate})`,
    // };
    return {
      width: transform.width,
      height: transform.height,
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0) rotate(${transform.rotate}) scale(${pagesScale})`,
      WebkitTransform: `translate3d(${transform.x}px, ${transform.y}px, 0) rotate(${transform.rotate}rad) scale(${pagesScale})`,
      msTransform: `translate(${transform.x}px, ${transform.y}px) rotate(${transform.rotate}) scale(${pagesScale})`,
      transformOrigin: "0 0"
    };
  }


  // const onFocus = useCallback((e) => {
  //   console.log('onFocus called #1');
  //   textRef.current.focus();
  //   e.stopPropagation();   
  //   setOperation("edit");
  // }, []);

  function onFocus() {
    console.log('onFocus called');
    // textRef.current.focus();
    setOperation("edit");
    setEditing(true);
  }

  // 컴포넌트가 포커스를 잃었을 때 발생하는 이벤트를 처리하는 데 사용되는 이벤트 핸들러
  const onBlur = (e) => {
    console.log('onBlur called');
    e.stopPropagation();

    if (e.currentTarget.contains(e.relatedTarget)) return;  //blur로 인해 옵션창이 닫히지 않게 처리

    // onChangeFontSize가 클릭 되었을때는 editing 상태로 두기
    if (!justdo) setEditing(false);
  }

  function onKeydown(e) {
    console.log('onKeydown called');
    const childNodes = Array.from(textRef.current.childNodes);
    if (e.keyCode === 13) {
      // prevent default adding div behavior
      e.preventDefault();
      const selection = window.getSelection();
      const focusNode = selection.focusNode;
      const focusOffset = selection.focusOffset;
      // the caret is at an empty line
      if (focusNode === textRef.current) {
        textRef.current.insertBefore(
          document.createElement("br"),
          childNodes[focusOffset]
        );
      } else if (focusNode instanceof HTMLBRElement) {
        textRef.current.insertBefore(document.createElement("br"), focusNode);
      }
      // the caret is at a text line but not end
      else if (focusNode.textContent.length !== focusOffset) {
        document.execCommand("insertHTML", false, "<br>");
        // the carat is at the end of a text line
      } else {
        let br = focusNode.nextSibling;
        if (br) {
          textRef.current.insertBefore(document.createElement("br"), br);
        } else {
          br = textRef.current.appendChild(document.createElement("br"));
          br = textRef.current.appendChild(document.createElement("br"));
        }
        // set selection to new line
        selection.collapse(br, 0);
      }
    }
  }

  // const onDoubleClick = (e) => {
  //   console.log('onDoubleClick called');
  //   e.stopPropagation();
  //   textRef.current.focus();
  // }

  const onClick = (e) => {
    console.log('onClick called');
    setEditing(true);
  }

  const onKeyUp = (e) => {
    console.log('onKeyUp called');
    e.stopPropagation();

    // console.log('lines', extractLines());
    updateItem(item.id, {lines : extractLines()}); 
  }

  // const onChangeFontSize = (obj) => {
  //   console.log('onChangeFontSize called');
  //   obj.stopPropagation();
  //   setFontSize(obj.target.value);
  //   updateItem(item.id, {size : parseInt(obj.target.value)});
  // }

  let justdo = false;
  const onChangeFontSize = (value) => {
    console.log('onChangeFontSize called');
    setFontSize(value);

    if (item.subType === TYPE_TEXT || item.subType === TYPE_DROPDOWN) {
      let newHeight = item.height * (parseInt(value) / item.fontSize);
      updateItem(item.id, {fontSize : parseInt(value), height: newHeight});
      setTransform((prevTransform) => ({
        ...prevTransform,
        height: newHeight
      }));
      
    } else {
      updateItem(item.id, {fontSize : parseInt(value)});
    }

    justdo = true;
  }

  const onChangeCoordinateX = (value) => {
    updateItem(item.id, {x : parseInt(value)});
    setTransform((prevTransform) => ({
      ...prevTransform,
      x: value * pagesScale,
    }));
  }

  const onChangeCoordinateY = (value) => {
    updateItem(item.id, {y : parseInt(value)});
    setTransform((prevTransform) => ({
      ...prevTransform,
      y: value * pagesScale
    }));
  }

  const onChangeLabel = (e) => {
    console.log('onChangeLabel called', e.target.value);
    updateItem(item.id, {label : e.target.value});
    if(item.subType !== TYPE_CHECKBOX && item.subType !== TYPE_SIGN) {
      textRef.current.innerHTML = e.target.value;
    }
  }

  const onChangeTextAlign = (value) => {
    console.log('onChangeTextAlign called', value);
    setTextAlign(value);
    updateItem(item.id, {textAlign : value});
    // justdo = true;
  }

  const extractLines = () => {
    const nodes = textRef.current.childNodes;
    const lines = [];
    let lineText = "";
    for (let index = 0; index < nodes.length; index++) {
      const node = nodes[index];
      if (node.nodeName === "BR") {
        lines.push(lineText);
        lineText = "";
      } else {
        lineText += node.textContent;
      }
    }
    lines.push(lineText);
    return lines;
  }

  const addInput = () => {
    setInputs([...inputs, '']);
    updateItem(item.id, {inputs : [...inputs, '']});
  };

  const removeInput = (indexToRemove) => {
    console.log('removeInput called', indexToRemove);

    setInputs((prev) => {
      const copy = [...prev];
      copy.splice(indexToRemove, 1); // index 기준으로 삭제

      updateItem(item.id, { inputs: copy });
      return copy;
    });
  };

  const onChangeInput = (e, index) => {
    const newInputs = [...inputs]; // 기존 배열 복사
    newInputs[index] = e.target.value; // 특정 index 값 변경
    setInputs(newInputs); // 상태 업데이트
    updateItem(item.id, {inputs : newInputs});
  };

  
  return (
    // <StyledBox color={item.color}>
    <Pannable
      disabled={disabled}
      shouldStart={shouldStart}
      onStart={onStart}
      onMove={onMove}
      onEnd={onEnd}
      // onDoubleClick={onDoubleClick}
      onClick={onClick}
      onKeyUp={onKeyUp}
      onBlur={onBlur}
      // onSelect={onSelect}
      // onMouseDown={onMouseDown} 
      // onFocus={onFocus}
      style={{
        ...convertTransform(transform),
        willChange: 'transform',
        border: `1px ${drag ? 'none' : 'solid'} ${item.borderColor ? item.borderColor : '#cccccc'}`,
        position: 'absolute',
        backgroundColor: `${item.background ? item.background : "rgba(193, 193, 193, 0.3)"}`,
        zIndex:editing?10:0   // 컴포넌트 편집시 더 상위에 보이도록 처리
      }}
      // className={clsx('pan', 'cursor-pointer', { 'pan-dragging-box': drag })}
      // className={clsx('pan', 'cursor-pointer', { 'pan-dragging-box': drag }, { 'pan-no-dragging-box': !drag })}
      // className={clsx('pan', { 'editing': ['edit'].includes(operation) }, { 'pan-dragging': drag }, { 'pan-no-dragging': !drag })}
      data-dragbox="dragbox"
    >

      {/* 상단 가로 라인 */}
      <div style={{position:'absolute', width:`${pageSize?.width/pagesScale}px`, marginLeft:`-${transformRef.current.x/pagesScale}px`, border: drag ? 'dotted 0.5px #78bce6' : 'none'}} />

      {/* 좌측 세로 라인 */}
      <div style={{position:'absolute', borderLeft:drag ? 'dotted 1px #78bce6' : 'none', height:`${pageSize?.height/pagesScale}px`, marginTop:`-${transformRef.current.y/pagesScale}px`}}></div>

      {/* 우측 세로 라인 */}
      <div style={{position:'absolute', borderLeft:drag ? 'dotted 1px #78bce6' : 'none', height:`${pageSize?.height/pagesScale}px`, marginTop:`-${transformRef.current.y/pagesScale}px`, marginLeft:`${transformRef.current.width}px`}}></div>

      {/* 하단 가로 라인 - 텍스트 컴포넌트가 아닌 경우 */}
      {item.subType !== TYPE_TEXT && item.subType !== TYPE_DROPDOWN  && <div style={{position:'absolute', width:`${pageSize?.width/pagesScale}px`, marginLeft:`-${transformRef.current.x/pagesScale}px`, marginTop:`${transformRef.current.height}px`, border: drag ? 'dotted 0.5px #78bce6' : 'none'}} />}

      <div
        ref={textRef}
        placeholder={item.placeholder ? item.placeholder : "텍스트"}
        onFocus={onFocus}
        // onBlur={onBlur}
        onKeyDown={onKeydown}
        // onMouseDown={() => console.log('onMouseDown #2')} 
        // on:paste|preventDefault={onPaste}
        contentEditable={item.subType === TYPE_CHECKBOX ? "false" :"true"}
        spellCheck="false"
        class="outline-none whitespace-no-wrap"
        style={{fontSize: `${fontSize}px`, color: 'gray', fontFamily: `${item.fontFamily}, serif`, lineHeight: `${item.lineHeight}`, WebkitUserSelect: 'text', textAlign: textAlign, height: `${transformRef.current.height}px`}}
        />

      {/* <div>{item.height} {transformRef.current.height}</div> */}

      {/* 하단 가로 라인 - 텍스트 컴포넌트인 경우 */}
      {item.subType === TYPE_TEXT || item.subType === TYPE_DROPDOWN && <div style={{position:'absolute', width:`${pageSize?.width/pagesScale}px`, marginLeft:`-${transformRef.current.x/pagesScale}px`, border: drag ? 'dotted 0.5px #78bce6' : 'none'}} />}

      {disabled ? (
        // <div onClick={onEdit} className="pan-edit">
        //   Edit
        // </div>
        <div></div>
      ) : (
        <Fragment>
          <div data-action="translate" className="pan-translate"></div>
          {/* <SvgScale data-action="scale" className="pan-scale" /> */}

          {item.subType !== TYPE_CHECKBOX &&
          <div data-action="scale" class="absolute right-0.5 bottom-0.5 w-2 h-2"><img src={item.subType === TYPE_TEXT || item.subType === TYPE_DROPDOWN ? SvgResizeBoth : SvgResizeBoth} alt="resize item" style={{cursor: item.subType === TYPE_TEXT || item.subType === TYPE_DROPDOWN ? 'nwse-resize' : 'nwse-resize'}} /></div>}

          {/* {(item.name && editing) && <div class="absolute left-0 -top-5 text-blue-500">{item.name}</div>} */}

          {item.color && <div className="absolute left-0 top-0" style={{width:0, height:0, borderBottom: '6px solid transparent', borderLeft: `6px solid ${item.color}`, borderRight: '6px solid transparent'}} />}

          {item.required && <div class="absolute -left-2 -top-1 text-red-500">*</div> }

          {/* <div
            onClick={() => textRef.current.focus()}
            class="absolute -left-2 -top-2 w-4 h-4 m-auto rounded-full bg-blue
            cursor-pointer transform md:scale-25">
            <img class="w-full h-full" src={SvgEdit} alt="edit" />
          </div> */}
          <div
            onClick={() => deleteItem(item.id)}
            class="absolute -right-2 -top-2 w-4 h-4 m-auto rounded-full bg-white
            cursor-pointer transform md:scale-25">
            <img class="w-full h-full" src={SvgDelete} alt="delete item" />
          </div>

          {(item.subType === TYPE_TEXT || item.subType === TYPE_DROPDOWN) && 
          <div hidden={!editing} class="absolute -bottom-17 left-2 w-150">
            {/* <div class='w-10 bg-blue-100'>aaa</div> */}
            {/* <div class='w-7 bg-gray-300'>aaabbb</div> */}
            {/* <div class='w-full bg-gray-200' style={{width:'100px'}}>Option <Button style={{alignContent:'right'}} icon={<CloseSquareOutlined />}></Button></div> */}
            <EditorArea>
              <Input ref={labelRef} style={{maxWidth:'90px', marginTop:'3px'}} placeholder='Label' onChange={onChangeLabel} value={item.label} maxLength={10} size='small' />
              <br></br>
              {/*Dropdown 시작*/}
                {item.subType === TYPE_DROPDOWN && (
                  <>
                    {inputs.map((input, index) => (
                    <div key={index} style={{ display: "flex", alignItems: "center", marginTop: "3px" }}>
                      <Button danger size="small" onClick={() => removeInput(index)} style={{ marginLeft: "1px" }}>-</Button>
                      <Input style={{ maxWidth: "90px" }} placeholder='옵션' maxLength={30} size="small" onChange={(e) => onChangeInput(e, index)} value={input} />
                    </div>
                  ))}
                  <Button size='small' style={{marginTop:'3px'}} onClick={addInput}>+ 추가</Button>
                  <br></br>
                  </>
                )}
              {/*Dropdown 종료*/}
              <InputNumber ref={fontSizeRef} style={{maxWidth:'90px', marginTop:'3px'}} addonBefore={<Icon component={SvgTextSize} style={{verticalAlign:'middle'}} />} min={9} max={30} step={1} size="small" onChange={onChangeFontSize} defaultValue={fontSize} />
              {/* </Button> */}
              <br></br>
              {/* <Button type="text" style={{marginTop:'-5px'}}> */}
              <Segmented
                style={{marginTop:'3px'}}
                size='small'
                onChange={onChangeTextAlign}
                options={[
                  {
                    value: 'left',
                    icon: <AlignLeftOutlined />,
                  },
                  {
                    value: 'center',
                    icon: <AlignCenterOutlined />,
                  },
                  {
                    value: 'right',
                    icon: <AlignRightOutlined />,
                  },
                ]}
              />
              <br></br>
              {/* </Button> */}
              <Switch style={{marginTop:'3px'}} checkedChildren="필수 입력" unCheckedChildren="필수 입력" checked={item.required} onChange={(checked) => {
                updateItem(item.id, {required : checked});
              }} />

              <br></br>
              {/* X: {item.x} Y: {item.y} */}
              <InputNumber style={{maxWidth:'90px', marginTop:'3px'}} addonBefore="x" min={0} max={pageSize?.width ? Math.ceil(pageSize.width/pagesScale) - transform.width : 0} step={1} size="small" onChange={onChangeCoordinateX} value={item.x} />
              <br></br>
              <InputNumber style={{maxWidth:'90px', marginTop:'3px'}} addonBefore="y" min={0} max={pageSize?.height ? Math.ceil(pageSize.height/pagesScale) - transform.height : 0} step={1} size="small" onChange={onChangeCoordinateY} value={item.y} />
              <br></br>
              <Button size='small' style={{minWidth:'90px', marginTop:'3px'}} onClick={(e)=>{e.stopPropagation();setEditing(false);}}>닫기</Button>

            </EditorArea>
          </div>}

          {(item.subType === TYPE_SIGN || item.subType === TYPE_CHECKBOX || item.subType === TYPE_IMAGE) && 
          <div hidden={!editing} class="absolute -bottom-17 left-2 w-150">
            <EditorArea>
              <Input ref={labelRef} style={{maxWidth:'90px', marginTop:'3px'}} placeholder='Label' onChange={onChangeLabel} value={item.label} maxLength={10} size='small' />
              <br></br>
              <Switch style={{minWidth:'80px', marginTop:'3px'}} checkedChildren="필수 입력" unCheckedChildren="필수 입력" checked={item.required} onChange={(checked) => {
                updateItem(item.id, {required : checked});
              }} />
              <br></br>
              {/* X: {item.x} Y: {item.y} */}
              <InputNumber style={{maxWidth:'90px', marginTop:'3px'}} addonBefore="x" min={0} max={pageSize?.width ? Math.ceil(pageSize.width/pagesScale) - transform.width : 0} step={1} size="small" onChange={onChangeCoordinateX} value={item.x} />
              <br></br>
              <InputNumber style={{maxWidth:'90px', marginTop:'3px'}} addonBefore="y" min={0} max={pageSize?.height ? Math.ceil(pageSize.height/pagesScale) - transform.height : 0} step={1} size="small" onChange={onChangeCoordinateY} value={item.y} />
              <br></br>
              <Button size='small' style={{minWidth:'90px', marginTop:'3px'}} onClick={(e)=>{e.stopPropagation();setEditing(false);}}>닫기</Button>
              
            </EditorArea>
          </div>}

        </Fragment>
      )}

    </Pannable>
    // </StyledBox>
  );
};

export default Box;