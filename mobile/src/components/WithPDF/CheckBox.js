import React, { Fragment, useEffect, useState, useRef, useCallback } from 'react';
import useDidMountEffect from './Common/useDidMountEffect';
import SvgScale from './SvgScale';
// import SvgDelete from './SvgDelete';
import { Pannable } from 'react-pannable';
// import clsx from 'clsx';
import './CheckBox.css';
import './tailwind.css';
import SvgDelete from './assets/images/delete.svg';
import { Checkbox } from 'antd';
import styled from 'styled-components';
const StyleCheckBox = styled.div`
.ant-checkbox .ant-checkbox-inner {
  background-color: transparent;
  border-color: rgb(14 165 233);
  border-width: 1px;
}

.ant-checkbox-checked .ant-checkbox-inner {
  background-color: rgb(14 165 233);
  border-color: rgb(14 165 233);
}

.ant-checkbox-disabled .ant-checkbox-inner {
  background-color: rgb(193, 193, 193, 0.3);
  border-color: rgb(193, 193, 193, 0.5);
}
`;

const CheckBox = ({item, deleteItem, updateItem, pageSize, pagesScale, scaleDirection}) => {

  // const [transform, setTransform] = useState({
  //   width: item.width,
  //   height: item.height,
  //   x: item.x ? item.x * pagesScale : 0,
  //   y: item.y ? item.y * pagesScale : 0,
  //   rotate: 0
  // });

  const [transform, setTransform] = useState({
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    rotate: 0,
  });

  const [drag, setDrag] = useState(null);
  const [disabled, setDisabled] = useState(item.disable ? item.disable : false);
  const [editing, setEditing] = useState(false);  
  // const [operation, setOperation] = useState();
  // const [fontSize, setFontSize] = useState(item.fontSize ? item.fontSize : 16);
  // const [textAlign, setTextAlign] = useState('center');

  const transformRef = useRef();
  // const canvasRef = useRef();
  transformRef.current = transform;
  // const textRef = useRef();

  useEffect(() => {

    console.log("Box useEffect called!", item);

    setTransform({
      width: item.width,
      height: item.height,
      x: item.x ? item.x * pagesScale : 0,
      y: item.y ? item.y * pagesScale : 0,
      rotate: 0
    })

    render();

  }, []);

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
    //       x: prevTransform.x * pagesScale / (pagesScale + 0.1),
    //       y: prevTransform.y * pagesScale / (pagesScale + 0.1)
    //     }));
    //   }
    // }

    setTransform((prevTransform) => ({
      ...prevTransform,
      x: item.x * pagesScale,
      y: item.y * pagesScale
    }));

  }, [pagesScale]);
  
  const render = async () => {
    console.log("render called")
  }

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

      if (action === 'translate') {

        // 영역 제한
        let _x = startTransform.x + translation.x;
        if (startTransform.x + translation.x <= 0) {
          _x = 0;
        } else if ( startTransform.x + translation.x >= (pageSize.width - transform.width * pagesScale)) {
          _x = (pageSize.width - transform.width * pagesScale);
        }

        let _y = startTransform.y + translation.y;

        if (startTransform.y + translation.y <= 0) {
          _y = 0;
        } else if ( startTransform.y + translation.y >= (pageSize.height - transform.height * pagesScale)) {
          _y = (pageSize.height - transform.height * pagesScale);
        }
            
        setTransform((prevTransform) => ({
          ...prevTransform,
          x: _x,
          y: _y
        }));

        // updateItem(item.id, transformRef.current);
        updateItem(item.id, {x: parseInt(_x / pagesScale), y: parseInt(_y / pagesScale)});

      }
      if (action === 'scale') {

        let _width = startTransform.width + translation.x;
        let _height = startTransform.height + translation.y;

        setTransform((prevTransform) => ({
          ...prevTransform,
          width: Math.max(25, _width),
          height: Math.max(25, _height),
        }));

        // updateItem(item.id, transformRef.current);
        updateItem(item.id, {x: transformRef.current.x / pagesScale, y: transformRef.current.y / pagesScale, width: Math.max(25, _width), height: Math.max(25, _height)});

      }
    },
    [drag]
  );

  const onEnd = useCallback(() => {
    console.log('onEnd called');
    setDrag(null);
    setEditing(false);
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


  // function onFocus() {
  //   console.log('onFocus called');
  //   textRef.current.focus();
  //   setOperation("edit");
  //   setEditing(true);
  // }

  const onBlur = (e) => {
    console.log('onBlur called');
    e.stopPropagation();

    if (e.currentTarget.contains(e.relatedTarget)) return;  //blur로 인해 옵션창이 닫히지 않게 처리

    // onChangeFontSize가 클릭 되었을때는 editing 상태로 두기
    if (!justdo) setEditing(false);
  }

  // function onKeydown(e) {
  //   console.log('onKeydown called');
  //   const childNodes = Array.from(textRef.current.childNodes);
  //   if (e.keyCode === 13) {
  //     // prevent default adding div behavior
  //     e.preventDefault();
  //     const selection = window.getSelection();
  //     const focusNode = selection.focusNode;
  //     const focusOffset = selection.focusOffset;
  //     // the caret is at an empty line
  //     if (focusNode === textRef.current) {
  //       textRef.current.insertBefore(
  //         document.createElement("br"),
  //         childNodes[focusOffset]
  //       );
  //     } else if (focusNode instanceof HTMLBRElement) {
  //       textRef.current.insertBefore(document.createElement("br"), focusNode);
  //     }
  //     // the caret is at a text line but not end
  //     else if (focusNode.textContent.length !== focusOffset) {
  //       document.execCommand("insertHTML", false, "<br>");
  //       // the carat is at the end of a text line
  //     } else {
  //       let br = focusNode.nextSibling;
  //       if (br) {
  //         textRef.current.insertBefore(document.createElement("br"), br);
  //       } else {
  //         br = textRef.current.appendChild(document.createElement("br"));
  //         br = textRef.current.appendChild(document.createElement("br"));
  //       }
  //       // set selection to new line
  //       selection.collapse(br, 0);
  //     }
  //   }
  // }

  // const onClick = (e) => {
  //   console.log('onClick called');
  //   e.stopPropagation();
  //   // textRef.current.focus();
  // }

  const onKeyUp = (e) => {
    console.log('onKeyUp called');
    e.stopPropagation();

    // console.log('lines', extractLines());
    // updateItem(item.id, {lines : extractLines()}); 
  }

  let justdo = false;

  const onChange = (e) => {
    console.log(`checked = ${e.target.checked}`);
    updateItem(item.id, {checked : e.target.checked});
  };
  
  return (
    <Pannable
      disabled={disabled}
      shouldStart={shouldStart}
      onStart={onStart}
      onMove={onMove}
      onEnd={onEnd}
      // onClick={onClick}
      onKeyUp={onKeyUp}
      onBlur={onBlur}
      hidden={item.hidden}
      style={{
        ...convertTransform(transform),
        willChange: 'transform',
        border: `1px ${drag ? 'dashed' : 'solid'} ${item.borderColor ? item.borderColor : '#78bce6'}`,
        position: 'absolute'
      }}
      // className={clsx('pan', 'cursor-pointer', { 'pan-dragging-checkbox': drag }, { 'pan-no-dragging-checkbox': !drag })}
      data-dragbox="dragbox"
    >

      {/* <div style={{textAlign:'center', verticalAlign:'middle'}}> */}
      <div className='text-center	align-bottom'>
        <StyleCheckBox>
          <Checkbox onChange={onChange} disabled={disabled} checked={item.checked ? item.checked : false}></Checkbox>
        </StyleCheckBox>
      {/* <input type="checkbox" id="_checkbox" onChange={onChangedCheckBox} onClick={onClickedCheckBox}></input> */}
      </div>

      {disabled ? (
        <div></div>
      ) : (
        <Fragment>
          {item.movable && <div data-action="translate" className="pan-translate"></div>}
          {/* <div data-action="scale" class="absolute right-0.5 bottom-0.5 w-2 h-2"><img src={SvgResizeBoth} alt="resize item" /></div> */}

          {item.required && <div class="absolute -left-2 -top-1 text-red-500">*</div> }
          
          {item.deletable && 
          <div
            onClick={() => deleteItem(item.id)}
            class="absolute -right-2 -top-2 w-4 h-4 m-auto rounded-full bg-white
            cursor-pointer transform md:scale-25">
            <img class="w-full h-full" src={SvgDelete} alt="delete item" />
          </div>
          }

        </Fragment>
      )}

    </Pannable>
  );
};

export default CheckBox;