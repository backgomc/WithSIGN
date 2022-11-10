import 'core-js/stable';
import 'regenerator-runtime/runtime';
import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';
// import 'fast-text-encoding/text';
import 'proxy-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import store from './app/store';
import { Provider } from 'react-redux';
import Intl from './components/Intl';
// import { BrowserRouter } from 'react-router-dom';

const consoleError = console.error.bind(console);
console.error = (errObj, ...args) => {
  if (args.includes('findDOMNode')) return;
  consoleError(errObj, ...args);
};

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <Intl>
        {/* <BrowserRouter> */}
          <App />
        {/* </BrowserRouter> */}
      </Intl>
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);