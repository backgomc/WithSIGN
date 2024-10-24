import React, { Fragment, useEffect, useState, useRef, useCallback } from 'react';
import useDidMountEffect from './Common/useDidMountEffect';
import SvgScale from './SvgScale';
// import SvgDelete from './SvgDelete';
import { Pannable } from 'react-pannable';
import clsx from 'clsx';
import './Text.css';
import './tailwind.css';
import SvgDelete from './assets/images/delete.svg';
import SvgEdit from './assets/images/edit.svg';
// import SvgResizeWidth from './assets/images/resize-width.svg';
import SvgResizeBoth from './assets/images/resize-both.svg';
import { Button, Switch, InputNumber, Segmented, Space, Divider } from 'antd';

// import { ReactComponent as svgTextSize} from './assets/images/text-size.svg';
import SvgTextSize from './assets/svg/SvgTextSize';

import Icon, { AlignCenterOutlined, AlignLeftOutlined, AlignRightOutlined } from '@ant-design/icons';
import styled from 'styled-components';
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

const Text = ({item, deleteItem, updateItem, pageSize, pagesScale, scaleDirection}) => {

  console.log("Text render !");

  // const [transform, setTransform] = useState({
  //   width: item.width,
  //   // height: item.fontSize * item.lineHeight * extractLines(),
  //   x: item.x ? item.x * pagesScale : 0,
  //   y: item.y ? item.y * pagesScale : 0,
  //   rotate: 0,
  //   // lines: item.lines
  // });

  const [transform, setTransform] = useState({
    width: 50,
    // height: 0,
    x: 0,
    y: 0,
    rotate: 0,
  });

  const [drag, setDrag] = useState(null);
  const [disabled, setDisabled] = useState(item.disable ? item.disable : false);
  const [editing, setEditing] = useState(false);
  const [isText, setIsText] = useState(false);
  const [operation, setOperation] = useState();
  const [fontSize, setFontSize] = useState(item.fontSize ? item.fontSize : 16);
  const [textAlign, setTextAlign] = useState(item.textAlign ? item.textAlign : 'left');
  

  const [componentHeight, setComponentHeight] = useState(0);


  const transformRef = useRef();
  const canvasRef = useRef();
  transformRef.current = transform;
  const textRef = useRef();
  
  useEffect(() => {

    console.log("Text useEffect called!", item);

    console.log('extractLines.length',extractLines().length)

    setComponentHeight(item.fontSize * item.lineHeight * extractLines().length);

    setTransform({
      width: item.width,
      height: item.height ? item.height : item.fontSize * item.lineHeight * extractLines().length,
      x: item.x ? item.x * pagesScale : 0,
      y: item.y ? item.y * pagesScale : 0,
      rotate: 0,
      // lines: item.lines
    })

    render();

  }, []);
  
  // pagesScale 이 변경되었을때 처리
  useDidMountEffect(() => {

    console.log("Text useDidMountEffect pagesScale called", pagesScale);
    // pageScale 이 1일때 x, y 좌표에 scale 값을 곱하여야 제대로 계산이 됨.

    // if (scaleDirection === 'up') {
    //   console.log('scaleDirection up')
    //   setTransform((prevTransform) => ({
    //     ...prevTransform,
    //     x: prevTransform.x * pagesScale / (pagesScale - 0.1),
    //     y: prevTransform.y * pagesScale / (pagesScale - 0.1)
    //   }));
    // } else if (scaleDirection === 'down') {  //down
    //   console.log('scaleDirection down')
    //   if (pagesScale === 0.9) {
    //     setTransform((prevTransform) => ({
    //       ...prevTransform,
    //       x: prevTransform.x * pagesScale,
    //       y: prevTransform.y * pagesScale
    //     }));
    //   } else {
    //     setTransform((prevTransform) => ({
    //       ...prevTransform,
    //       x: prevTransform.x * pagesScale / (pagesScale + 0.1),
    //       y: prevTransform.y * pagesScale / (pagesScale + 0.1)
    //     }));
    //   }
    // } else {
    //   console.log('mouse down called');

    //   setTransform((prevTransform) => ({
    //     ...prevTransform,
    //     x: item.x * pagesScale,
    //     y: item.y * pagesScale
    //   }));
    // }
    setTransform((prevTransform) => ({
      ...prevTransform,
      x: item.x * pagesScale,
      y: item.y * pagesScale
    }));

  }, [pagesScale]);

  const render = async () => {

    console.log("render called")
    textRef.current.innerHTML = item.text;
    // textRef.current.focus();

    updateItem(item.id, {lines : extractLines()});

    textRef.current.innerHTML.replaceAll('<br>', '').length > 0 ? setIsText(true) : setIsText(false);

    // setTransform((prevTransform) => ({
    //   ...prevTransform,
    //   height: Math.max(22.4, item.fontSize * item.lineHeight * extractLines())
    // }));

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
        let textHeight =  item.fontSize * item.lineHeight * extractLines().length; 

        if (startTransform.y + translation.y <= 0) {
          _y = 0;
        } else if ( startTransform.y + translation.y >= (pageSize.height - textHeight * pagesScale)) {
          _y = (pageSize.height - textHeight * pagesScale);
        }
            
        setTransform((prevTransform) => ({
          ...prevTransform,
          x: _x,
          y: _y,
          // x: startTransform.x + translation.x,
          // y: startTransform.y + translation.y,
        }));

        // updateItem(item.id, transformRef.current);
        updateItem(item.id, {x: parseInt(_x / pagesScale), y: parseInt(_y / pagesScale), width:transformRef.current.width, height:transformRef.current.height});

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

        // 텍스트 사이즈에 맞춰 높이를 설정
        _height = parseInt(_height / (item.fontSize * item.lineHeight)) * (item.fontSize * item.lineHeight)

        setTransform((prevTransform) => ({
          ...prevTransform,
          width: Math.max(25, _width),
          height: Math.max(item.fontSize * item.lineHeight, _height)
          // height: Math.max(50, startTransform.height + translation.y),
        }));

        // updateItem(item.id, transformRef.current);
        updateItem(item.id, {x: transformRef.current.x / pagesScale, y: transformRef.current.y / pagesScale, width: Math.max(25, _width), height: Math.max(item.fontSize * item.lineHeight, _height)});

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
    if (disabled) {
      textRef.current.blur();
      return;
    }

    textRef.current.focus();
    setOperation("edit");

    // console.log('item.disableOptions', item.disableOptions)
    if (!item.disableOptions) { // 컴포넌트 편집기능 가능 여부 체크
      setEditing(true);
    }
  }

  const onBlur = (e) => {
    // console.log('onBlur called');
    // console.log('currentTarget', e.currentTarget);
    // console.log('relatedTarget', e.relatedTarget);
    e.stopPropagation();

    if (e.currentTarget.contains(e.relatedTarget)) return;  //blur로 인해 옵션창이 닫히지 않게 처리

    // onChangeFontSize가 클릭 되었을때는 editing 상태로 두기
    if (!justdo) setEditing(false);
  }


  function measureText(pText, pFontSize, pStyle) {
    var lDiv = document.createElement('div');
  
    document.body.appendChild(lDiv);
  
    if (pStyle != null) {
        lDiv.style = pStyle;
    }
    lDiv.style.fontSize = "" + pFontSize + "px";
    lDiv.style.position = "absolute";
    lDiv.style.left = -1000;
    lDiv.style.top = -1000;
  
    lDiv.textContent = pText;
  
    var lResult = {
        width: lDiv.clientWidth,
        height: lDiv.clientHeight
    };
  
    document.body.removeChild(lDiv);
    lDiv = null;
  
    return lResult;
  }


  const extractLinesSeparate = () => {
    let newLines = []
    const lines = extractLines();
    lines.forEach((line, idx) => {
      const words = line.split('');
      let currentLine = '';
      words.forEach(word => {
        const textLine = currentLine.length === 0 ? word : `${currentLine}${word}`;
        const textWidth =  measureText(textLine, fontSize).width;

        if (textWidth+1 <= item.width) {
          currentLine = textLine;
        } else {
          newLines.push(currentLine);
          currentLine = word;
        }

      })
      newLines.push(currentLine);
    })
    return newLines;
  }

  function onKeydown(e) {

    // console.log('onKeydown called', e.keyCode);
    const childNodes = Array.from(textRef.current.childNodes);
    // console.log('childNodes', childNodes)
    // console.log('textRef.current', textRef.current)

    // 영역을 넘는 엔터키 방지
    if(!item.resizable) {
      let _height;
      const lines = extractLines();
      if (lines[lines.length-1] === '') {
        _height = item.fontSize * item.lineHeight * (lines.length - 1);
      } else {
        _height = item.fontSize * item.lineHeight * (lines.length);
      }

      if (_height === item.height && e.keyCode === 13) {
        e.preventDefault();
        return;
      }
    }

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

  const onInput = (e) => {
    // console.log('onInput called');
    // console.log('onInput extractLines()', extractLines())
    // console.log('onInput extractLinesSeparate()', extractLinesSeparate())

    // 영역 초과 시 입력 방지
    // 예전에 만든 텍스트 컴포넌트의 경우 높이 값이 없어 입력이 안되는 문제가 있어서 우선 주석 처리함
    // if(!item.resizable) {
    //   if (extractLinesSeparate().length * item.fontSize * item.lineHeight > item.height) {
    //     const text = textRef.current.innerHTML;
    //     textRef.current.innerHTML = text.substring(0, text.length - 1);
    //     textRef.current.focus()
  
    //     window.getSelection().selectAllChildren(textRef.current)
    //     window.getSelection().collapseToEnd()
  
    //   }
    // }
  }

  const onDoubleClick = (e) => {
    console.log('onDoubleClick called');
    e.stopPropagation();
    textRef.current.focus();
  }

  const onClick = (e) => {
    console.log('onClick called');
    e.stopPropagation();

    if (disabled) {
      textRef.current.blur();
      return;
    }

    textRef.current.focus();
  }

  const onKeyUp = (e) => {
    console.log('onKeyUp called');
    e.stopPropagation();

    // 텍스트가 없는 경우 background 에 컬러 추가
    // console.log('innerHTML', textRef.current.innerHTML.replaceAll('<br>', ''));
    // console.log('innerHTML length', textRef.current.innerHTML.replaceAll('<br>', '').trim().length);
    textRef.current.innerHTML.replaceAll('<br>', '').length > 0 ? setIsText(true) : setIsText(false);

    // console.log('lines', extractLines());

    // height 계산하여 적용
    let _height;
    if (extractLines()[extractLines().length - 1] === '') {
      _height = item.fontSize * item.lineHeight * (extractLines().length - 1);
    } else {
      _height = item.fontSize * item.lineHeight * (extractLines().length);
    }

    // console.log('item.height', item.height)
    
    setTransform((prevTransform) => ({
      ...prevTransform,
      height: Math.max(item.height, _height)
    }));

    updateItem(item.id, {lines : extractLines(), height: Math.max(item.height, _height)}); 
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

    

    // TODO 폰트 사이즈 조절 시 높이 계산하여 적용하기 

    // // 텍스트 사이즈에 맞춰 높이를 설정
    // let _height = parseInt(_height / (item.fontSize * item.lineHeight)) * (item.fontSize * item.lineHeight)

    // setTransform((prevTransform) => ({
    //   ...prevTransform,
    //   width: Math.max(25, _width),
    //   height: Math.max(item.fontSize * item.lineHeight, _height)
    //   // height: Math.max(50, startTransform.height + translation.y),
    // }));


    // console.log('H', item.height / (item.fontSize * item.lineHeight * extractLines().length))

    console.log('height',  item.height);
    let newHeight = item.height * (parseInt(value) / item.fontSize);
    console.log('newHeight', newHeight);


    updateItem(item.id, {fontSize : parseInt(value), height: newHeight});

    setTransform((prevTransform) => ({
      ...prevTransform,
      height: newHeight
      // height: Math.max(15, parseInt(value) * item.lineHeight * extractLines().length)
    }));

    justdo = true;
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
  
  return (
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
      hidden={item.hidden}
      style={{
        ...convertTransform(transform),
        willChange: 'transform',
        border: `1px ${drag ? 'none' : 'solid'} ${item.borderColor ? item.borderColor : (disabled ? '#e2e2e2' : '#78bce6')}`,
        position: 'absolute',
        background: isText || disabled ? 'transparent' : 'rgba(186, 224, 255, 0.5)',
        zIndex:editing?10:0   // 컴포넌트 편집시 더 상위에 보이도록 처리
      }}
      // className={'cursor-pointer'}
      // className={clsx('pan', 'cursor-pointer', { 'pan-dragging': drag }, { 'pan-no-dragging': !drag })}
      // className={clsx('pan', { 'editing': ['edit'].includes(operation) }, { 'pan-dragging': drag }, { 'pan-no-dragging': !drag })}
      data-dragbox="dragbox"
    >

      {/* 상단 가로 라인 */}
      {/* <hr style={{position:'absolute', width:`${pageSize?.width/pagesScale}px`, marginLeft:`-${transformRef.current.x/pagesScale}px`, border: drag ? 'dashed 0.5px #78bce6' : 'none'}} /> */}
      <div style={{position:'absolute', width:`${pageSize?.width/pagesScale}px`, height:'auto', marginLeft:`-${transformRef.current.x/pagesScale}px`, border: drag ? 'dotted 0.5px #78bce6' : 'none'}} />

      {/* 좌측 세로 라인 */}
      <div style={{position:'absolute', borderLeft:drag ? 'dotted 1px #78bce6' : 'none', height:`${pageSize?.height/pagesScale}px`, marginTop:`-${transformRef.current.y/pagesScale}px`}}></div>

      {/* 우측 세로 라인 */}
      <div style={{position:'absolute', borderLeft:drag ? 'dotted 1px #78bce6' : 'none', height:`${pageSize?.height/pagesScale}px`, marginTop:`-${transformRef.current.y/pagesScale}px`, marginLeft:`${transformRef.current.width}px`}}></div>

      {/* 하단 가로 라인 */}
      <div style={{position:'absolute', width:`${pageSize?.width/pagesScale}px`, marginLeft:`-${transformRef.current.x/pagesScale}px`, marginTop:`${transformRef.current.height}px`, border: drag ? 'dotted 0.5px #78bce6' : 'none'}} />
  
      <div
        ref={textRef}
        placeholder={item.placeholder ? item.placeholder : "텍스트"}  //disable 이면 placeholder 숨기기
        onFocus={onFocus}
        // onBlur={onBlur}
        onKeyDown={onKeydown}
        onInput={onInput}
        // onMouseDown={() => console.log('onMouseDown #2')} 
        // on:paste|preventDefault={onPaste}
        contentEditable="true"
        // contentEditable={item.editable ? item.editable : true}  // not working ...
        spellCheck="false"
        class="outline-none whitespace-no-wrap"
        style={{fontSize: `${fontSize}px`, fontFamily: `${item.fontFamily}, serif`, lineHeight: `${item.lineHeight}`, WebkitUserSelect: 'text', textAlign: textAlign, height: `${transformRef.current.height}px`, wordBreak: 'break-all' }}
        />

      {/* 하단 가로 라인 */}
      {/* <hr style={{position:'absolute', width:`${pageSize?.width/pagesScale}px`, marginLeft:`-${transformRef.current.x/pagesScale}px`, border: drag ? 'dashed 0.5px #78bce6' : 'none'}} /> */}
      {/* <div style={{position:'absolute', width:`${pageSize?.width/pagesScale}px`, marginLeft:`-${transformRef.current.x/pagesScale}px`, border: drag ? 'dotted 0.5px #78bce6' : 'none'}} /> */}

      {disabled ? (
        // <div onClick={onEdit} className="pan-edit">
        //   Edit
        // </div>
        <div></div>
      ) : (
        <Fragment>
          {item.movable && <div data-action="translate" className="pan-translate"></div>}
          {/* <SvgScale data-action="scale" className="pan-scale" /> */}
          {item.resizable && <div data-action="scale" class="absolute right-0.5 bottom-0.5 w-2 h-2" style={{cursor:'nwse-resize'}}><img src={SvgResizeBoth} alt="resize item" /></div>}

          {item.required && <div class="absolute -left-2 -top-1 text-red-500">*</div> }
          {/* <div
            onClick={() => textRef.current.focus()}
            class="absolute -left-2 -top-2 w-4 h-4 m-auto rounded-full bg-blue
            cursor-pointer transform md:scale-25">
            <img class="w-full h-full" src={SvgEdit} alt="edit" />
          </div> */}

          {item.deletable && 
          <div
            onClick={() => deleteItem(item.id)}
            class="absolute -right-2 -top-2 w-4 h-4 m-auto rounded-full bg-white
            cursor-pointer transform md:scale-25">
            <img class="w-full h-full" src={SvgDelete} alt="delete item" />
          </div>
          }

          {/* <div hidden={!editing} class="absolute -bottom-8 left-0 m-auto h-6 w-11 border-solid"> */}
          
          <div hidden={!editing} class="absolute -bottom-15 left-2 w-150">
            {/* <div class='w-10 bg-blue-100'>aaa</div> */}
            {/* <div class='w-7 bg-gray-300'>aaabbb</div> */}
            {/* <div class='w-full bg-gray-200' style={{width:'100px'}}>Option <Button style={{alignContent:'right'}} icon={<CloseSquareOutlined />}></Button></div> */}
            <EditorArea>
              
              {/* <Button type="text" style={{marginTop:'2px'}}> */}
              <InputNumber style={{ maxWidth:'90px', marginTop:'4px'}} addonBefore={<Icon component={SvgTextSize} style={{verticalAlign:'middle'}} />} min={10} max={30} step={1} size="small" onChange={onChangeFontSize} defaultValue={fontSize} />
              {/* </Button> */}
              {/* <Button type="text" style={{marginTop:'-5px'}}> */}
              <br></br>
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

              {/* <Switch style={{marginTop:'3px'}} checkedChildren="필수 입력" unCheckedChildren="필수 입력" checked={item.required} onChange={(checked) => {
                updateItem(item.id, {required : checked});
              }} /> */}
              
            </EditorArea>

            

            {/* <input
              type="number"
              min="12"
              max="35"
              step="1"
              onChange={onChangeFontSize}
              class="w-full h-full text-center flex-shrink-1 rounded-sm"
              value={fontSize} /> */}
          </div>

        </Fragment>
      )}

    </Pannable>
  );
};

export default React.memo(Text);