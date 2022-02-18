import React, { useEffect } from 'react';
// import axios from 'axios';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const SystemManage = () => {
  useEffect(() => {
    return () => {} // cleanup
  }, []);

  // return (
  //   <div>
  //       SystemManage
  //   </div>
  // );
  const handleExcel = async () => { 
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('My Sheet');
    
    // sheet 데이터 설정
    worksheet.columns = [
      { header: 'Id', key: 'id', width: 10 },
      { header: 'Name', key: 'name', width: 32 },
      { header: 'D.O.B.', key: 'DOB', width: 10, outlineLevel: 1 }
    ];
    
    worksheet.addRow({ id: 1, name: 'John Doe', dob: new Date(1970, 1, 1) });
    worksheet.addRow({ id: 2, name: 'Jane Doe', dob: new Date(1965, 1, 7) });
    
    // 다운로드
    const mimeType = { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], mimeType);
    saveAs(blob, 'testExcel.xlsx');
  };
  
  return (
    <div>
      <button onClick={handleExcel}>엑셀 내보내기!!</button>
    </div>
  );
};

export default SystemManage;
