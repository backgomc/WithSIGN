import React from 'react';
import { ConfigProvider } from 'antd';
import enUS from 'antd/lib/locale-provider/en_US';
import koKR from 'antd/lib/locale-provider/ko_KR';
import { IntlProvider } from 'react-intl';
import kr from '../../assets/i18n/kr.json';
import en from '../../assets/i18n/en.json';
import { useSelector } from 'react-redux';
// import { selectLang } from '../../app/langSlice';

export default function Intl(props) {
  const localLang = useSelector(state => state.lang.localLang);
  // const localLang = useSelector(selectLang);
  const i18nData = {kr, en};
  const languageMap = {
    'kr': koKR,
    'en': enUS
  };

  return (
    <IntlProvider key={localLang} locale={localLang} messages={i18nData[localLang]}>
      <ConfigProvider locale={languageMap[localLang]}>
        {props.children}
      </ConfigProvider>
    </IntlProvider>
  );
};