import React, {useEffect} from 'react';
import ReactPDF, { Page, Text, View, Document, StyleSheet, PDFViewer, Font } from '@react-pdf/renderer';
import Header from './Header';
import Moment from 'react-moment';
import font from '../../assets/font/NanumGothic.ttf';
import font_Bold from '../../assets/font/NanumGothic-ExtraBold.ttf';
import { navigate } from '@reach/router';

import { ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons';

Font.register({ family: "Nanum Gothic", src: font });
Font.register({ family: "Nanum Gothic Bold", src: font_Bold });


const tableStyle = {
  display: "table",
  width: "auto",
};

const tableRowStyle = {
  flexDirection: "row",
};

const tableCellHeaderStyle = {
  textAlign: "center",
  margin: 4,
  padding: 3,
  bottom: 0,
  fontSize: 11,
  fontFamily: 'Nanum Gothic',
  // fontWeight: "bold",
};

const tableCellStyle = {
  textAlign: "left",
  margin: 4,
  padding: 3,
  paddingLeft: 7,
  fontSize: 11,
  fontFamily: 'Nanum Gothic',
};

const styles = StyleSheet.create({
  page: {
    padding: 30,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    '@media max-width: 400': {
      flexDirection: 'column',
    },
  },
  image: {
    marginBottom: 10,
  },
  leftColumn: {
    flexDirection: 'column',
    width: 170,
    paddingTop: 30,
    paddingRight: 15,
    '@media max-width: 400': {
      width: '100%',
      paddingRight: 0,
    },
    '@media orientation: landscape': {
      width: 200,
    },
  },
  footer: {
    fontSize: 12,
    fontFamily: 'Nanum Gothic Bold',
    textAlign: 'center',
    marginTop: 15,
    paddingTop: 5,
    borderWidth: 3,
    borderColor: 'gray',
    borderStyle: 'dashed',
    '@media orientation: landscape': {
      marginTop: 10,
    },
  },
  entryContainer: {
    paddingTop: 30,
    marginBottom: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    marginBottom: 10
  },
  leftColumn: {
    flexDirection: 'column',
    flexGrow: 9,
  },
  rightColumn: {
    flexDirection: 'column',
    flexGrow: 1,
    alignItems: 'flex-end',
    justifySelf: 'flex-end',
  },
  detailContainer: {
    flexDirection: 'row',
  },
  title: {
    fontSize: 14,
    color: 'black',
    textDecoration: 'none',
    fontFamily: 'Nanum Gothic Bold',
  },
  date: {
    fontSize: 11,
    fontFamily: 'Nanum Gothic',
  },
});

const AuditDocument = (props) => {

  const { item } = props
  const docTitle = item.docTitle.normalize('NFC') // 한글 자소 분리 문제 해결 (참조: https://egg-programmer.tistory.com/293) 

  // const [instance, updateInstance] = usePDF({ document: MyDocument });


  const createTableRow = (headerName, value, headerCellWidth, valueCellWidth) => {
    let tableColHeaderStyle = {
      width: `${headerCellWidth}%`,
      borderStyle: "solid bottom",
      borderColor: "#000",
      // borderBottomColor: "#000",
      borderWidth: 1,
      // borderBottom: 1,
      backgroundColor: "#bdbdbd",
      marginBottom: -1,
      marginRight: -1
    };
    
    let tableColStyle = {
      width: `${valueCellWidth}%`,
      borderStyle: "solid",
      borderColor: "#000",
      borderWidth: 1,
      marginBottom: -1
    };

    return (
      <View style={tableRowStyle} fixed>
        <View style={tableColHeaderStyle}>
          <Text style={tableCellHeaderStyle}>{headerName}</Text>
        </View>

        <View style={tableColStyle}>
          <Text style={tableCellStyle}>{value}</Text>
        </View>

      </View>
    );
  };

  const MyDocument = () => (

      <Document>
        <Page size="A4" style={styles.page}>
          <Header />

          <View style={styles.entryContainer}>
            <View style={styles.headerContainer}>
              <View style={styles.leftColumn}>
                <Text style={styles.title}>문서 정보</Text>
              </View>
            </View>
            {/* <List>
              <Item style={styles.detailContainer}>문서 이름: {docTitle}</Item>
            </List> */}

            <View style={tableStyle}>
              {createTableRow("문서명", docTitle, 20, 80)}
              {createTableRow("문서 ID",item._id, 20, 80)}
              {createTableRow("문서 Hash", item.docHash, 20, 80)}
              {createTableRow("기준 시간", "(UTC+09:00) 한국 표준시", 20, 80)}
              {createTableRow("서명 진행 상태","완료", 20, 80)}
           </View>
          
          <View style={{margin:12}}/>

           {/* 서명 요청자 정보 */}
           <View style={styles.headerContainer}>
             <View style={styles.leftColumn}>
               <Text style={styles.title}>서명요청자 정보</Text>
             </View>
           </View>
           <View style={tableStyle}>
              {createTableRow("이름", item.user.name +" "+ item.user.JOB_TITLE, 20, 80)}
              {createTableRow("요청 시간", <Moment format='YYYY/MM/DD HH:mm'>{item.requestedTime}</Moment>, 20, 80)}
           </View>

          <View style={{margin:12}}/>

           {/* 서명 참여자 정보 */}
           <View style={styles.headerContainer}>
             <View style={styles.leftColumn}>
               <Text style={styles.title}>서명참여자 정보 ({item.users.length}명)</Text>
             </View>
           </View>

           {item.signedBy.map(({ user, signedTime, ip }) => (
            <View style={{display: "table", width: "auto", marginBottom: "10"}}>
            {createTableRow("이름", item.users.filter(e => e._id === user)[0].name + " " + item.users.filter(e => e._id === user)[0].JOB_TITLE, 20, 80)}
            {createTableRow("서명 시간", <Moment format='YYYY/MM/DD HH:mm'>{signedTime}</Moment>, 20, 80)}
            {createTableRow("IP 정보", ip, 20, 80)}
            </View>
          ))}

        </View>

      </Page>
    </Document>
  );

  return (
    <MyDocument />
  );

};

export default React.memo(AuditDocument);