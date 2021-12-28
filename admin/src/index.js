import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import store from './app/store';
import { Provider } from 'react-redux';
import Intl from './components/Intl';
// import reportWebVitals from './reportWebVitals';

// findDOMNode 로그 제외 (antd는 React StrictMode 모드에서 작동안함)
const consoleError = console.error.bind(console);
console.error = (errObj, ...args) => {
  if (args.includes('findDOMNode')) return;
  consoleError(errObj, ...args);
};

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <Intl>
        <App />
      </Intl>
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
