import React, { Fragment, useEffect, useState, useRef, useCallback } from 'react';
import useDidMountEffect from './Common/useDidMountEffect';
import SvgScale from './SvgScale';
// import SvgDelete from './SvgDelete';
import { Pannable } from 'react-pannable';
import clsx from 'clsx';
import './image.css';
import './tailwind.css';
import SvgDelete from './assets/images/delete.svg';
import SvgResizeBoth from './assets/images/resize-both.svg';
import SvgReload from './assets/images/eraser.svg';   // ISSUE: 해당 이미지는 CRA5 에서는 컴파일이 안됨
import { readAsImage } from "./utils/asyncReader.js";
import SignModal from './SignModal';
import { TYPE_SIGN, TYPE_IMAGE, TYPE_TEXT, TYPE_BOX } from './Common/Constants';
import { scale } from 'pdf-lib';

const Image = ({item, deleteItem, updateItem, pageSize, pagesScale, scaleDirection, signList, setSignList }) => {

  console.log("Image render !");

  const resizedImage = () => {
    console.log('resizedImage called')
    let scale = 1;
    const limit = 200;
    if(item.width > limit) {
      scale = limit / item.width;
    }

    if (item.height > limit) {
      scale = Math.min(scale, limit / item.height);
    }

    return {width: item.width * scale, height: item.height * scale}
  }

  const initVisibleLabel = () => {
    if (item.type === TYPE_SIGN) {
      if (item.payload) {
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }
  }

  // state에 바로 초기화시 리로딩이 자주 일어나므로 ... useEffect 에서 값 초기화로 변경 
  // const [transform, setTransform] = useState({
  //   width: resizedImage().width,
  //   height: resizedImage().height,
  //   x: item.x ? item.x * pagesScale : 0,
  //   y: item.y ? item.y * pagesScale : 0,
  //   rotate: 0,
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
  // const [signModal, setSignModal] = useState(false);
  const [visibleModal, setVisibleModal] = useState(false);
  const [addNewSign, setAddNewSign] = useState(false);
  const [visibleLabel, setVisibleLabel] = useState(initVisibleLabel());


  const transformRef = useRef();
  const canvasRef = useRef();
  transformRef.current = transform;
  
  // const [signList, setSignList] = useState([]);
  const sigCanvas = useRef({});
  

  useEffect(() => {

    console.log("Image useEffect called!", item);

    setTransform({
      width: resizedImage().width,
      height: resizedImage().height,
      x: item.x ? item.x * pagesScale : 0,
      y: item.y ? item.y * pagesScale : 0,
      rotate: 0
    })

    render();

  }, []);

  // pagesScale 이 변경되었을때 처리
  // scale 이 1일때 x 좌표에 scale 을 곱하면 된다.
  // scale 이 1일때 x,y 좌표를 어딘가에 저장해 둬야하나?
  // TODO: 돌아는 가는데 리팩토링 필요
  useDidMountEffect(() => {
    console.log('Image useDidMountEffect called');
    // console.log('current x', transformRef.current.x);
    // console.log('pagesScale', pagesScale);
    // console.log('pageWidth', pageSize.width);
    // console.log('scaleDirection', scaleDirection);

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

    setTransform((prevTransform) => ({
      ...prevTransform,
      x: item.x * pagesScale,
      y: item.y * pagesScale
    }));

  }, [pagesScale]);

  const render = async () => {

    console.log("render called")

    // if (!["image/jpeg", "image/png"].includes(item.file?.type)) return;

    // // get the scale
    // var scale = Math.min(transform.width / item.width, transform.height / item.height);
    // // get the top left position of the image
    // var x = (transform.width / 2) - (item.width / 2) * scale;
    // var y = (transform.height / 2) - (item.height / 2) * scale;

    // console.log('transform', transform.width, transform.height)
    // console.log('222', canvasRef.current.width, canvasRef.current.height)
    // console.log('item', item.width, item.height)
    // console.log('scale', scale)
    // console.log('x,y', x, y)


    //TODO: 왜 item과 item.payload에 값이 다르지 ???
    // console.log('item', item);
    // console.log('item.payload', item.payload);

    // item.payload.onload = function() {
    //   canvasRef.current.getContext("2d").drawImage(item.payload, 0, 0, canvasRef.current.width, canvasRef.current.height);
    // };

    if (item.payload) {
      canvasRef.current.getContext("2d").drawImage(item.payload, 0, 0, canvasRef.current.width, canvasRef.current.height);
    }

  }

  // const onDelete = () => {
  //   deleteItem(item.id);
  // }

  // const onDelete2 = useCallback(() => {
  //   deleteItem(item.id);
  // }, []); 

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

      console.log('pageWidth', pageSize.width);
      console.log('pageHeight', pageSize.height);
      console.log('startTransform.x', startTransform.x);
      console.log('translation.x', translation.x);
      console.log('transform.width', transform.width);
      console.log('transform.height', transform.height);

      if (action === 'translate') {

        // 영역 제한
        // AS-IS 
        // let _x = startTransform.x + translation.x;
        // if (startTransform.x + translation.x <= 0) {
        //   _x = 0;
        // } else if ( startTransform.x + translation.x >= (pageSize.width - transform.width) * pagesScale) {
        //   _x = (pageSize.width - transform.width) * pagesScale;
        // }

        // let _y = startTransform.y + translation.y;
        // if (startTransform.y + translation.y <= 0) {
        //   _y = 0;
        // } else if ( startTransform.y + translation.y >= (pageSize.height - transform.height) * pagesScale) {
        //   _y = (pageSize.height - transform.height) * pagesScale;
        // }

        // TO-BE : pageSize 가 scale 변화에 따라 변경된 값을 받아서 처리
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
          y: _y,
          // x: startTransform.x + translation.x,
          // y: startTransform.y + translation.y,
        }));


        //AS_IS
        // updateItem(item.id, transformRef.current);
        //TO-BE
        // TODO: x, y 위치는 scale 적용 필요
        // console.log('xxx1', _x);
        // console.log('yyy1', _y);
        // console.log('xxx2', parseInt(_x / pagesScale));
        // console.log('yyy2', parseInt(_y / pagesScale));

        // console.log('transformRef.current.width', transformRef.current.width)
        // console.log('transformRef.current.height', transformRef.current.height)

        updateItem(item.id, {x: parseInt(_x / pagesScale), y: parseInt(_y / pagesScale), width:transformRef.current.width, height:transformRef.current.height});

      }
      if (action === 'scale') {

        // 영역 제한 
        // TODO: return 을 주면 끊어 지는 것 같다. 속도 개선이 필요함
        let _width = startTransform.width + translation.x;
        // if (transformRef.current.x + (startTransform.width + translation.x) * pagesScale > pageSize.width * pagesScale) {
        //  return;
        // }

        let _height = startTransform.height + translation.y;
        // if (transformRef.current.y + (startTransform.height + translation.y) * pagesScale > pageSize.height * pagesScale) {
        //  return;
        // }

        setTransform((prevTransform) => ({
          ...prevTransform,
          width: Math.max(50, _width),
          height: Math.max(25, _height),
        }));

        console.log('transformRef.current.x', transformRef.current.x / pagesScale)
        console.log('transformRef.current.y', transformRef.current.y / pagesScale)

        // updateItem(item.id, transformRef.current);
        updateItem(item.id, {x: transformRef.current.x / pagesScale, y: transformRef.current.y / pagesScale, width: Math.max(50, _width), height:Math.max(25, _height)});

      }
    },
    [drag]
  );

  const onEnd = useCallback(() => {
    setDrag(null);
  }, []);

  const onClick = useCallback((e) => {
    console.log('onClick called')
    e.stopPropagation();
    if (disabled) return;

    if (item.type === TYPE_SIGN) {
      setVisibleModal(true);
    }

  }, [])

  const onSelect = useCallback(() => {
    console.log('onSelect called')
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
    //   msTransform: `translate(${transform.x}px, ${transform.y}px) rotate(${transform.rotate})`
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

  // function getDraggableKey(target) {
  //   if (target.dataset) {
  //     if (target.dataset.draggable) {
  //       return target.dataset.draggable;
  //     }
  
  //     if (target.dataset.dragbox) {
  //       return null;
  //     }
  //   }
  
  //   if (target.parentNode) {
  //     return getDraggableKey(target.parentNode);
  //   }
  
  //   return null;
  // }

  const onDelete = (e) => {
    e.stopPropagation();
    deleteItem(item.id);
  }
  
  const onReset = (e) => {
    e.stopPropagation();
    canvasRef.current.getContext("2d").clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);  // 초기화
    setVisibleLabel(isCanvasEmpty());
    updateItem(item.id, {payload: null});
  }

  // signModal callback 
  const signComplete = async (signData) => {
    console.log("✈️ Image.js - signComplete start, item.uid : " + item.uid );
    
    try {
      const img = await readAsImage(signData);

      updateItem(item.id, {payload: img, isSave: addNewSign});

      setAddNewSign(false)

      canvasRef.current.getContext("2d").clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);  // 초기화
      canvasRef.current.getContext("2d").drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height); // 새로 그리기

      setVisibleLabel(isCanvasEmpty());

    } catch (e) {
      console.log(e);
    }
  }
  //

  function isCanvasEmpty() {
    const context = canvasRef.current.getContext("2d");;
    if (context) {
      const pixelBuffer = new Uint32Array(
        context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height).data.buffer
      );
      return !pixelBuffer.some(color => color !== 0);
    } else {
      return true;
    }

  }

  return (
    <>
    <Pannable
      disabled={disabled}
      shouldStart={shouldStart}
      onStart={onStart}
      onMove={onMove}
      onClick={onClick}
      onSelect={onSelect}
      onEnd={onEnd}
      hidden={item.hidden}
      style={{
        ...convertTransform(transform),
        willChange: 'transform',
        border: `1px ${drag ? 'none' : 'solid'} ${item.borderColor ? item.borderColor : (item.disable ? '#e2e2e2' : '#78bce6')}`,
        background: visibleLabel && !item.disable ? 'rgba(186, 224, 255, 0.5)' : 'transparent',
        position: 'absolute'
      }}
      // className={'pan'}
      // className={clsx('pan', { 'image-dragging': drag }, { 'image-no-style': !drag && item.noStyle }, { 'image-no-dragging': !drag && !visibleLabel && !item.noStyle },  { 'image-no-dragging-impact': !drag && visibleLabel && !item.noStyle })}
      data-dragbox="dragbox"
    >
      {/* <SvgSticker className="pan-sticker-image" /> */}
      {/* <img src={DogImage} className="pan-sticker-image"></img> */}          
      {/* <Button type="primary">{item.id}</Button> */}

      {/* 상단 가로 라인 */}
      <div style={{position:'absolute', width:`${pageSize?.width/pagesScale}px`, marginLeft:`-${transformRef.current.x/pagesScale}px`, border: drag ? 'dotted 0.5px #78bce6' : 'none'}} />

      {/* 좌측 세로 라인 */}
      <div style={{position:'absolute', borderLeft:drag ? 'dotted 1px #78bce6' : 'none', height:`${pageSize?.height/pagesScale}px`, marginTop:`-${transformRef.current.y/pagesScale}px`}}></div>

      {/* 우측 세로 라인 */}
      <div style={{position:'absolute', borderLeft:drag ? 'dotted 1px #78bce6' : 'none', height:`${pageSize?.height/pagesScale}px`, marginTop:`-${transformRef.current.y/pagesScale}px`, marginLeft:`${transformRef.current.width}px`}}></div>

      <canvas 
        className="pan-image"
        ref={canvasRef}>
      </canvas>

      {/* 하단 가로 라인 */}
      <div style={{position:'absolute', width:`${pageSize?.width/pagesScale}px`, marginLeft:`-${transformRef.current.x/pagesScale}px`, marginTop:`${transformRef.current.height}px`, border: drag ? 'dotted 0.5px #78bce6' : 'none'}} />

      {disabled ? (
        // <div onClick={onEdit} className="pan-edit">
        //   Edit
        // </div>

        ((item.type === TYPE_SIGN) && item.tag) && 
          <div class="absolute left-0 top-0 bg-gray-400	text-white">{item.tag}</div>

      ) : (
        <Fragment>
          {/* <SvgPan
            data-action="translate"
            className="pan-sticker-translate"
          /> */}
          {item.movable && <div data-action="translate" className="pan-translate"></div>}
          {/* <SvgScale data-action="scale" className="pan-scale" /> */}
          {item.resizable && <div data-action="scale" class="absolute right-0.5 bottom-0.5 w-2 h-2" style={{cursor:'nwse-resize'}}><img src={SvgResizeBoth} alt="resize item" /></div>}

          {item.required && <div class="absolute -left-2 -top-1 text-red-500">*</div> }

          {/* <SvgRotate data-action="rotate" className="pan-sticker-rotate" /> */}
          {/* <div onClick={onDone} className="pan-sticker-edit">
            Done
          </div> */}

          {((item.type === TYPE_SIGN) && !visibleLabel) && 
          <div
            onClick={onReset}
            class="absolute left-0 top-0 right-0 w-4 h-4 m-auto rounded-full bg-white
            cursor-pointer transform -translate-y-1/2 md:scale-25">
            <img class="w-full h-full" src={SvgReload} alt="delete item" />
          </div>
          }
          
          {item.deletable && 
          <div
            onClick={onDelete}
            class="absolute -right-2 -top-2 w-4 h-4 m-auto rounded-full bg-white
            cursor-pointer transform md:scale-25">
            <img class="w-full h-full" src={SvgDelete} alt="delete item" />
          </div>
          }

          {((item.type === TYPE_SIGN) && visibleLabel) && 
          <div class="absolute left-0 top-0 bg-blue-600 text-white font-semibold">서명</div> }
          

          {/* <SvgDelete onClick={() => deleteItem(item.id)} class="absolute color-pink-300 left-0 top-0 right-0 w-5 h-5 m-auto rounded-full bg-white
  cursor-pointer transform -translate-y-1/2 md:scale-25" />  */}
          {/* <div onClick={() => deleteItem(item.id)} className="pan-sticker-edit">
            Delete
          </div> */}
        </Fragment>
      )}

    </Pannable>
            
    <SignModal visibleModal={visibleModal} setVisibleModal={setVisibleModal} addNewSign={addNewSign} setAddNewSign={setAddNewSign} signComplete={signComplete} signList={signList} />

    </>
  );
};

export default React.memo(Image);