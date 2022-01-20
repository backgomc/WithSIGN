import React, { useEffect, useState } from 'react';
import Moment from 'react-moment';
import { v4 as uuidv4 } from 'uuid';
import { Page, Text, View, Link, Image, Document, StyleSheet, Font } from '@react-pdf/renderer';
import font from '../../assets/font/NanumGothic.ttf';
import fontBold from '../../assets/font/NanumGothic-ExtraBold.ttf';
import LogoImage from '../../assets/images/logo_withsign1.png'
import LogoText from '../../assets/images/logo_withsign2.png'

Font.register({ family: 'NanumGothic', src: font });
Font.register({ family: 'NanumGothicBold', src: fontBold });

const tableStyle = {
  display: 'table',
  width: 'auto'
};

const styles = StyleSheet.create({
  font: {
    fontFamily: 'NanumGothic'
  },
  page: {
    padding: 30
  },
  titleContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#112131',
    borderBottomStyle: 'solid',
    alignItems: 'stretch'
  },
  entryContainer: {
    paddingTop: 30,
    marginBottom: 10
  },
  headerContainer: {
    flexDirection: 'row',
    marginBottom: 10
  },
  detailContainer: {
    flexDirection: 'row'
  },
  leftColumn: {
    flexDirection: 'column',
    flexGrow: 9
  },
  rightColumn: {
    flexDirection: 'column',
    flexGrow: 1,
    alignItems: 'flex-end',
    justifySelf: 'flex-end'
  },
  titleColumn: {
    flexDirection: 'column',
    flexGrow: 9,
    textTransform: 'uppercase'
  },
  linkColumn: {
    flexDirection: 'column',
    flexGrow: 2,
    alignSelf: 'flex-end',
    justifySelf: 'flex-end'
  },
  title: {
    fontFamily: 'NanumGothicBold',
    fontSize: 18
  },
  subtitle: {
    fontFamily: 'NanumGothicBold',
    fontSize: 10,
    justifySelf: 'flex-end'
  },
  link: {
    flexDirection: 'row',
    fontSize: 10,
    color: 'black',
    textDecoration: 'none',
    alignSelf: 'flex-end',
    justifySelf: 'flex-end',
  },
  logoImage: {
    width: '15px',
    height: '15px',
    marginVertical: 5
  },
  logoText: {
    width: '54px',
    height: '15px',
    marginVertical: 5
  }
});

let fontsLoaded = false;
let forceUpdate = null;

// Force loading and wait for loading to finish
Promise.all([
  Font.load({ fontFamily: 'NanumGothic' }),
  Font.load({ fontFamily: 'NanumGothicBold' })
]).then(() => {
  fontsLoaded = true;
  if (forceUpdate) forceUpdate();
});

// Helper to trigger an update in a functional component
function useForceUpdate () {
  const [value, setValue] = useState(0);
  return () => setValue(value => value + 1);
}

const AuditDocument = (props) => {

  let { item } = props;
  
  const [data, setData] = useState([]);

  useEffect(() => {
    return () => {} // cleanup
  }, [data]);
  
  forceUpdate = useForceUpdate();
  if (!fontsLoaded) {
    data = {}
    return <div/>
  }

  const createTableRow = (headerName, value, headerCellWidth, valueCellWidth) => {
    const tableRowStyle = {
      flexDirection: 'row'
    };
    const tableCellHeaderStyle = {
      textAlign: 'center',
      margin: 4,
      padding: 3,
      bottom: 0,
      fontSize: 11
    };
    const tableCellStyle = {
      textAlign: 'left',
      margin: 4,
      padding: 3,
      paddingLeft: 7,
      fontSize: 11
    };
    const tableColHeaderStyle = {
      width: `${headerCellWidth}%`,
      borderStyle: "solid bottom",
      borderColor: "#000",
      borderWidth: 1,
      backgroundColor: "#bdbdbd",
      marginBottom: -1,
      marginRight: -1
    };
    const tableColStyle = {
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

  const Header = () => (
    <View style={styles.titleContainer}>
      <View style={styles.titleColumn}>
        <Text style={styles.title}>진본확인 증명서</Text>
        <Text style={styles.subtitle}></Text>
      </View>
      <View style={styles.linkColumn}>
        <Link href="/" style={styles.link}>
          <Image src={LogoImage} style={styles.logoImage}/>
          <Text> </Text>
          <Image src={LogoText} style={styles.logoText}/>
        </Link>
      </View>
    </View>
  );

  return (
    <Document style={styles.font}>
      <Page size="A4" style={styles.page}>
        <Header/>
        <View style={styles.entryContainer}>
          <View style={styles.headerContainer}>
            <View style={styles.leftColumn}>
              <Text style={styles.title}>문서 정보</Text>
            </View>
          </View>
          <View style={tableStyle}>
            {createTableRow('문서명', item.docTitle, 20, 80)}
            {createTableRow('문서 ID',item._id, 20, 80)}
            {createTableRow('문서 Hash', item.docHash, 20, 80)}
            {createTableRow('기준 시간', '(UTC+09:00) 한국 표준시', 20, 80)}
            {createTableRow('서명 진행 상태','완료', 20, 80)}
          </View>
          <View style={{margin:12}}/>
          <View style={styles.headerContainer}>
            <View style={styles.leftColumn}>
              <Text style={styles.title}>서명요청자 정보</Text>
            </View>
          </View>
          <View style={tableStyle}>
            {createTableRow('이름', item.user.name +' '+ item.user.JOB_TITLE, 20, 80)}
            {createTableRow('요청 시간', <Moment format='YYYY/MM/DD HH:mm'>{item.requestedTime}</Moment>, 20, 80)}
          </View>
          <View style={{margin:12}}/>
          <View style={styles.headerContainer}>
            <View style={styles.leftColumn}>
              <Text style={styles.title}>서명참여자 정보 ({item.users.length}명)</Text>
            </View>
          </View>
          {item.signedBy.map(({ user, signedTime, ip }) => (
          <View key={uuidv4()} style={{display: 'table', width: 'auto', marginBottom: '10'}}>
            {createTableRow('이름', item.users.filter(e => e._id === user)[0].name + ' ' + item.users.filter(e => e._id === user)[0].JOB_TITLE, 20, 80)}
            {createTableRow('서명 시간', <Moment format='YYYY/MM/DD HH:mm'>{signedTime}</Moment>, 20, 80)}
            {createTableRow('IP 정보', ip, 20, 80)}
          </View>
          ))}
        </View>
      </Page>
    </Document>
  )
}

export default AuditDocument;
