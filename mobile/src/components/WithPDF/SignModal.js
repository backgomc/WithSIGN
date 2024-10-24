import React, { useEffect, useState, useRef } from 'react';
import './image.css';
import './tailwind.css';
import SignaturePad from 'react-signature-canvas';
import ProCard, { CheckCard } from '@ant-design/pro-card';
import { Button, Modal, Checkbox } from 'antd';
import { v4 as uuID } from 'uuid';

const SignModal = ({visibleModal, setVisibleModal, addNewSign, setAddNewSign, signComplete, signList }) => {

  // const [signList, setSignList] = useState([]);
  const sigCanvas = useRef({});

  const [canvasWidth, setCanvasWidth] = useState(350); // Default width
  const [canvasHeight, setCanvasHeight] = useState(200); // Default height

  useEffect(() => {
    console.log("SignModal useEffect called!", visibleModal);

    if (visibleModal) {
      sigCanvas.current.clear();
      sigCanvas.current.off();
      sigCanvas.current.on();

      // S. Retina 지원 ------------------------
      const canvas = sigCanvas.current.getCanvas();
      const ratio = Math.max(window.devicePixelRatio || 1, 1);

      const newCanvasWidth = Math.min(window.innerWidth * 0.9 - 48, 350);
      const newCanvasHeight = Math.min(newCanvasWidth * 0.57 , 200); //200/350=0.57
      console.log('newCanvasWidth', newCanvasWidth)
      console.log('newCanvasHeight', newCanvasHeight)

      // 캔버스 해상도 설정
      canvas.width = newCanvasWidth * ratio;
      canvas.height = newCanvasHeight * ratio;

      // CSS 스타일로 실제 크기를 설정
      canvas.style.width = `${newCanvasWidth}px`;
      canvas.style.height = `${newCanvasHeight}px`;

      for (var i = 0; i < document.getElementsByClassName('signBackground').length; i++) {
        document.getElementsByClassName('signBackground')[i].style.width = `${newCanvasWidth}px`;
        document.getElementsByClassName('signBackground')[i].style.height = `${newCanvasHeight}px`;
      }

      // 해상도에 맞춰 스케일링
      const ctx = canvas.getContext('2d');
      ctx.scale(ratio, ratio);

      // E. Retina 지원 ------------------------

    }

  }, [visibleModal]);

  //S.Configure
  const clear = () => {
    sigCanvas.current.clear();
    setAddNewSign(false);
    let chkObj = document.getElementsByClassName('ant-pro-checkcard-checked'); // 선택한 서명
    if (chkObj && chkObj[0]) chkObj[0].click();
  }

  const changeAddSignCheck = (e) => {
    console.log("[CSI] changeAddSignCheck - e.target.checked : " + e.target.checked);
    setAddNewSign(e.target.checked)
  };
  
  const handleOk = async () => {
    const signData = sigCanvas.current.toDataURL('image/png');

    if (!sigCanvas.current.isEmpty()) {
        await signComplete(signData);   //callback
    }
    setVisibleModal(false);
    clear();
  }

  const handleCancel = () => {
    setVisibleModal(false);
    clear();
  };

  const signCard = (sign) => {
    return <CheckCard key={uuID()} style={{width:'auto', height: 'auto'}} value={sign.signData} avatar={sign.signData} className="customSignCardCSS"/>
  }
  //E.Configure

  return (
    <>
    <Modal
      visible={visibleModal}
      width={Math.min(window.innerWidth * 0.9, 450)}
      title="직접서명 또는 서명선택"
      onOk={handleOk}
      onCancel={handleCancel}
      footer={[
        <Checkbox key="checkbox" checked={addNewSign} onChange={changeAddSignCheck} style={{float:'left'}}>서명 저장</Checkbox>,
        <Button key="back" onClick={clear}>지우기</Button>,
        <Button key="submit" type="primary" onClick={handleOk}>확인</Button>
      ]}
      bodyStyle={{padding: '0px 24px'}}
    >
      <ProCard layout="center" bodyStyle={{padding: '20px 0px'}}>
        <SignaturePad penColor='black' ref={sigCanvas} canvasProps={{width:canvasWidth, height:canvasHeight, className: 'signCanvas'}} />
        <div className="signBackground" ><div class="signHereText">직접서명 또는 서명선택</div></div>
      </ProCard>
      <CheckCard.Group style={{width: '100%', margin: '0px', padding: '0px', whiteSpace: 'nowrap', overflow: 'auto', textAlign: 'center'}}
        onChange={(value) => {
          sigCanvas.current.clear();
          if (value) sigCanvas.current.fromDataURL(value);
        }}
      >
        {signList && signList.map((sign) => (signCard(sign)))}
      </CheckCard.Group>
    </Modal>

    </>
  );
};

export default SignModal;