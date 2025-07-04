import React from 'react';

const SvgImage = props => (
  <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" {...props}>
    <path d="M0 0v8h8v-8h-8zm1 1h6v3l-1-1-1 1 2 2v1h-1l-4-4-1 1v-3z" />
  </svg>
);

export default SvgImage;