import React from 'react';

import { Link, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import logo_withsign from '../../assets/images/logo_withsign.png';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#112131',
    borderBottomStyle: 'solid',
    alignItems: 'stretch',
  },
  detailColumn: {
    flexDirection: 'column',
    flexGrow: 9,
    textTransform: 'uppercase',
  },
  linkColumn: {
    flexDirection: 'column',
    flexGrow: 2,
    alignSelf: 'flex-end',
    justifySelf: 'flex-end',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Nanum Gothic Bold',
  },
  subtitle: {
    fontSize: 10,
    justifySelf: 'flex-end',
    fontFamily: 'Nanum Gothic',
  },
  link: {
    fontFamily: 'Nanum Gothic',
    fontSize: 10,
    color: 'black',
    textDecoration: 'none',
    alignSelf: 'flex-end',
    justifySelf: 'flex-end',
  },
  image_logo: {
    width: '72px',
    height: '15px',
    marginVertical: 5
  }
});

export default () => (
  <View style={styles.container}>
    <View style={styles.detailColumn}>
      <Text style={styles.title}>진본확인 증명서</Text>
      <Text style={styles.subtitle}> </Text>
    </View>
    <View style={styles.linkColumn}>
      <Link href="/" style={styles.link}>
        {/* WithSign */}
        {/* <Image
          style={styles.image_logo1}
          src={logo_withsign1}
        /> */}
        <Image
          style={styles.image_logo}
          src={logo_withsign}
        />
      </Link>
    </View>
  </View>
);
