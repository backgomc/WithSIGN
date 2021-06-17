import { message } from 'antd';
//===================================================================
// Timeout
//===================================================================
const timerAction = (time = 5000) => {
  return new Promise((resolve, reject) => {
    setTimeout(reject, time, 'Request timeout');
  });
};

//===================================================================
// request
//===================================================================
const request = async (url, config) => {
  try {
    let res = await Promise.race([fetch(url, config), timerAction()]);

    if (!res.ok) {
      throw new Error('Server error');
    }

    if (res.url.includes('export') && res.status === 200) {
      let fetchResult = await res.blob();
      let a = document.createElement('a');
      let url = window.URL.createObjectURL(fetchResult);
      let filename = 'CurrentAlarm-' + new Date().getTime() + '.csv';
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      let fetchResult = await res.json();

      if (fetchResult && (fetchResult.success === false || fetchResult.isSuc === false)) {
        throw new Error(fetchResult.message || '');
      } else {
        return fetchResult;
      }
    }
  } catch (e) {
    message.error(e.toString());
  }
};

//===================================================================
// GET
//===================================================================
export const get = async (url, params) => {
  if (params) {
    let paramsArray = [];
    Object.keys(params).forEach(key => paramsArray.push(key + '=' + params[key]));
    
    if (url.search(/\?/) === -1) {
      url += '?' + paramsArray.join('&');
    } else {
      url += '&' + paramsArray.join('&');
    }
  }

  return request(url, {method: 'GET'});
};

//===================================================================
// POST
//===================================================================
export const post = async (url, data) => {
  return request(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(data)
  });
};

//===================================================================
// PUT
//===================================================================
export const put = async (url, data) => {
  return request(url, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(data)
  });
};

//===================================================================
// DELETE
//===================================================================
export const del = async (url, data) => {
  return request(url, {
    method: 'DELETE',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(data)
  });
};