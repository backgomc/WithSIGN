import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import useDidMountEffect from './Common/useDidMountEffect';
import './tailwind.css';
import { debounce } from 'lodash';

const Style = styled.div`
  .canvas_wrap {
    background-color: orange;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 50px;
  }
  .canvas {
    background-color: white;
    border: 1px solid black;
  } 
`;

const PDFPage = ({idx, page, setPagesScale, setPagesSize, pagesScale}) => {

  let mobileWidth = 640; // default: 가로문서 640, 세로문서 인 경우 840 적용
  const canvasRef = useRef(null);

  const [width, setWidth] = useState();
  const [height, setHeight] = useState();

  let _width;

  useEffect(() => {

    console.log("[useEffect] called");
    
    render();

    return () => {
      // window.removeEventListener("resize", measure);
    };

  }, []);

  // 화면이 처음 로딩시에는 호출되지 않도록 처리
  // scale이 변경된 경우 호출
  useDidMountEffect(() => {

    console.log("[useDidMountEffect] called, pagesScale:", pagesScale);
    //TODO: pageScale 변환시 다시 그리지 않고 처리할 수 있는 방법은 없을까?
    draw(true);

  }, [pagesScale]);
  

  const render = async () => {

    console.log("[render] called")
    
    await draw();
    measure();

    // window.addEventListener("resize", measure);
  }

  // debounce 를 통해 잦은 리렌더링 방지 처리
  const measure = debounce(() => {

    console.log('[measure] called');
    console.log('[measure] canvasRef.current.clientWidth:', canvasRef.current.clientWidth);
    console.log('[measure] _width:', _width);
    console.log('[measure] pageScale before:', pagesScale); 

    // measure 메서드는 이벤트 리스너 함수이므로 state 변화를 감지 하지 못한다.
    // 즉 처음 지정한 pageScale 이 여기 메소드 내에서는 변화하지 않으므로 pageScale 을 가중치 용도로 활용함 
    // 아래 처리는 canvas 에서 max-w-full 사용하는 경우 사용, 현재는 사용하지 않으므로 OFF
    // let _scale = canvasRef.current.clientWidth / _width * pagesScale; 
    // console.log('[measure] pageScale after:', _scale); 
    // setPagesScale(_scale)

    // 문서가 현재 화면 보다 큰 경우 재조절 
    if (canvasRef.current.clientWidth > window.innerWidth) {
      let _scale = Math.min(window.innerWidth / mobileWidth, 1);
      console.log('[measure] pageScale after:', _scale);
      setPagesScale(_scale)  
    }
    
  }, 500);

  // const measure = () => {

  //   console.log('measure called');

  //   console.log('canvasRef.current.clientWidth', canvasRef.current.clientWidth);
  //   console.log('_width', _width);
  //   console.log('measure pageScale', pagesScale); 

  //   // measure 메서드는 이벤트 리스너 함수이므로 state 변화를 감지 하지 못한다.
  //   // 즉 처음 지정한 pageScale 이 여기 메소드 내에서는 변화하지 않으므로 pageScale 을 가중치 용도로 활용함 
  //   // let _scale = canvasRef.current.clientWidth / _width; 
  //   let _scale = canvasRef.current.clientWidth / _width * pagesScale; 
  //   setPagesScale(_scale)
    
  // }
  

  const draw = async (isRedraw = false) => {

    // 신규로 그릴때 viewport.width 를 미리 알 수가 없어서 화면이 아래 값보다 적은 경우 redraw 됨
    // redraw 시 timeout 을 줘서 빠른 리렌더링시 오류 방지함 => PC 가 늦으면 delay를 더 줘야할 수 도 있음
    // scroll로 zoom 하는 경우 resize 이벤트가 너무 자주 발생하여 주기를 조정할 필요가 있음
    // viewport.width 612 (세로 문서)
    // viewport.width 841.92 (가로 문서)
    console.log("[draw] called", isRedraw, pagesScale);
        
    const wait = (timeToDelay) => new Promise((resolve) => setTimeout(resolve, timeToDelay)) // delay

    const _page = await page;
    const context = canvasRef.current.getContext("2d");


    // 가로|세로 문서 구분 하기
    // scale 1일때 pdf 가로 width 추출 
    // const t0 = performance.now();
    const viewportDefault = _page.getViewport({ scale: 1 });
    console.log('viewportDefault.width', viewportDefault.width);
    if (viewportDefault.width <= 640) {  // 세로문서
      mobileWidth = 640;
    } else {  // 가로문서
      mobileWidth = 840;
    }
    // rotation 속성이 없는 PDF도 있어 위의 방법으로 처리함
    // let rotation = viewportDefault.rotation;
    // console.log('rotation', rotation)
    // if(rotation === 0 || rotation === 180) {
    //   // 세로 문서
    //   mobileWidth = 640;
    // } else {
    //   // 가로 문서 
    //   mobileWidth = 840;
    // }
    // const t1 = performance.now();
    // console.log('viewportDefaultScale performance',t1 - t0, 'ms');



    // const viewport = _page.getViewport({ scale: pagesScale, rotation: 0 });
    const viewport = _page.getViewport({ scale: pagesScale });

    if (isRedraw) { 
      // console.log("a")
      // console.log("viewport.width", viewport.width)
      // console.log("canvasRef.current.clientWidth ", canvasRef.current.clientWidth)
      // console.log("pagesScale ", pagesScale)
      await wait(10);  // deplay 0.1 second
      // console.log("b")
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      context.beginPath();
    }

    canvasRef.current.style.width =  Math.floor(viewport.width) + "px";
    canvasRef.current.style.height = Math.floor(viewport.height) + "px";

    const outputScale = window.devicePixelRatio || 1;
    const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

    setWidth(Math.floor(viewport.width * outputScale));
    setHeight(Math.floor(viewport.height * outputScale));

    console.log('[draw] outputScale:', outputScale)
    console.log('[draw] viewport.width:', viewport.width)
    console.log('[draw] canvasRef.current.clientWidth:', canvasRef.current.clientWidth)
    
    _width = Math.floor(viewport.width);

    // TODO: 최초 실행 시 화면이 작으면 그리지 않는다. measure 를 통해 재계산된 pageScale로 재호출 되므로 ...
    // canvas 대신에 progress 띄우는 것 고려 
    // 속도 및 기능 테스트 (render만 안하는게 속도향상에 도움이 될까?)
    // if (!isRedraw) {
    //   if (viewport.width > canvasRef.current.clientWidth) {
    //     console.log('[draw] 그리지 않고 PASS')
    //     return;
    //   }
    // }

    // setPagesSize((prev) => (
    //   [...prev, ...[{idx: idx, width:Math.floor(viewport.width), height: Math.floor(viewport.height)}]]
    // ))

    setPagesSize((prev) => (
      [...prev.filter(el => el.idx !== idx), ...[{idx: idx, width:Math.floor(viewport.width), height: Math.floor(viewport.height)}]]
    ))

    await _page.render({
      canvasContext: context,
      transform: transform,
      viewport
    }).promise;
  }

  return (
    <div>
        <canvas 
          ref={canvasRef}
          // class="max-w-full" // re-draw 의 원인, 스크롤로 화면을 줄일때마다 사이즈에 맞게 전체를 리렌더링하므로 파일이 큰 경우 깨지는 문제가 있어서 해당 기능 OFF 처리
          width={width}
          height={height}
        ></canvas>
    </div>
    
  );
};

export default PDFPage;